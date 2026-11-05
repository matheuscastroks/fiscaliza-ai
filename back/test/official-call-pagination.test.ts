import test from 'node:test';
import assert from 'node:assert/strict';
import {
  callCursorScope,
  encodeCallCursor,
  decodeCallCursor,
} from '../src/official-call-pagination.js';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';

test('cursor keeps the date and protocol tie breaker and binds to filters', () => {
  const scope = callCursorScope({ search: 'ilumina', limit: '50' });
  assert.equal(
    scope,
    callCursorScope({
      limit: '50',
      cursor: 'next',
      includeTotal: 'false',
      search: 'ilumina',
    }),
  );
  const date = new Date('2026-10-20T12:00:00.000Z');
  const cursor = encodeCallCursor(date, '0099', scope);
  assert.deepEqual(decodeCallCursor(cursor, scope), {
    date: date.toISOString(),
    id: '0099',
  });
  const precise = '2026-10-20T12:00:00.123456Z';
  assert.equal(
    decodeCallCursor(encodeCallCursor(precise, '0099', scope), scope).date,
    precise,
  );
  assert.throws(() =>
    decodeCallCursor(cursor, callCursorScope({ search: 'saude', limit: '50' })),
  );
  for (const invalid of [
    '?',
    'x'.repeat(2049),
    Buffer.from('{"date":"oops"}').toString('base64url'),
  ]) {
    assert.throws(() => decodeCallCursor(invalid, scope));
  }
  assert.throws(() =>
    decodeCallCursor(
      encodeCallCursor('2026-02-30T12:00:00.000Z', '0099', scope),
      scope,
    ),
  );
});

test(
  'cursor pages keep ties, skip counts on continuation and reject another filter scope',
  {
    skip: !process.env.DATABASE_URL,
  },
  async (t) => {
    const { pool } = database();
    const app = await buildApp();
    t.after(async () => {
      await pool.query(
        "DELETE FROM official_calls WHERE service_type='pagination-fixture'",
      );
      await app.close();
      await pool.end();
    });
    for (const id of ['90001', '90002', '90003']) {
      await pool.query(
        `INSERT INTO official_calls(id, external_id, service_type, service_subtype, opened_at)
      VALUES($1,$2,'pagination-fixture','fixture','2026-10-20T10:00:00Z')
      ON CONFLICT(id) DO NOTHING`,
        ['pagination-fixture-' + id, id],
      );
    }
    const url = '/api/rio1746/calls?tipo=pagination-fixture&limit=2';
    const firstResponse = await app.inject({ url });
    assert.equal(firstResponse.statusCode, 200, firstResponse.body);
    const first = firstResponse.json().data;
    assert.equal(first.total, 3);
    assert.deepEqual(
      first.calls.map((x: { externalId: string }) => x.externalId),
      ['90003', '90002'],
    );
    assert.equal(first.hasMore, true);
    const continuation = `&cursor=${encodeURIComponent(first.nextCursor)}&includeTotal=false`;
    const second = (await app.inject({ url: url + continuation })).json().data;
    assert.equal(second.total, null);
    assert.deepEqual(
      second.calls.map((x: { externalId: string }) => x.externalId),
      ['90001'],
    );
    assert.equal(second.hasMore, false);
    assert.equal(second.nextCursor, null);
    const legacy = (await app.inject({ url: url + '&page=2' })).json().data;
    assert.equal(legacy.total, 3);
    assert.deepEqual(legacy.calls, second.calls);
    assert.equal(
      (await app.inject({ url: url + continuation + '&page=2' })).statusCode,
      400,
    );
    assert.equal(
      (
        await app.inject({
          url: url.replace('pagination-fixture', 'another') + continuation,
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (await app.inject({ url: url + '&cursor=invalid' })).statusCode,
      400,
    );
    // JavaScript Date truncates microseconds; the cursor must preserve PostgreSQL precision.
    for (const [id, fraction] of [
      ['90004', '123999'],
      ['90005', '123998'],
    ]) {
      await pool.query(
        `INSERT INTO official_calls(id, external_id, service_type, service_subtype, opened_at)
        VALUES($1,$2,'pagination-fixture','precise',$3::timestamptz)`,
        [
          'pagination-fixture-' + id,
          id,
          '2026-10-20T11:00:00.' + fraction + 'Z',
        ],
      );
    }
    const preciseUrl =
      '/api/rio1746/calls?tipo=pagination-fixture&subtipo=precise&limit=1';
    const precise = (await app.inject({ url: preciseUrl })).json().data;
    assert.equal(precise.calls[0].externalId, '90004');
    const preciseNext = (
      await app.inject({ url: preciseUrl + '&cursor=' + precise.nextCursor })
    ).json().data;
    assert.equal(preciseNext.calls[0].externalId, '90005');
  },
);
