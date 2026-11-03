import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { database } from '../src/db.js';
import { buildApp } from '../src/app.js';
import { seed } from '../src/seed-data.js';
import { newToken, tokenHash } from '../src/auth.js';

test('occurrence filters and support ordering run before paging', { skip: !process.env.DATABASE_URL }, async t => {
  const { db, pool } = database();
  const app = await buildApp();
  t.after(async () => { await app.close(); await pool.end(); });
  await seed(db);
  const citizen = (await pool.query("SELECT id FROM users WHERE email='beatrizarante@gmail.com'")).rows[0];
  const token = newToken();
  await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '5 minutes')", [tokenHash(token), citizen.id]);
  const headers = { authorization: `Bearer ${token}`, 'x-fiscaliza-client': 'citizen' };
  const prefix = 'paging-' + randomUUID();
  const base = (await pool.query("SELECT * FROM records WHERE kind='occurrence' LIMIT 1")).rows[0];
  assert.ok(base);
  const ids = [0, 1, 2].map(i => prefix + '-' + i);
  t.after(async () => {
    // The owning test database is isolated; remove only this test's fixtures.
    const { pool: cleanup } = database();
    try { await cleanup.query('DELETE FROM records WHERE id = ANY($1)', [ids]); }
    finally { await cleanup.end(); }
  });
  for (const [i, id] of ids.entries()) {
    const data = { ...base.data, id, title: prefix, description: 'literal % underscore _', status: 'resolved',
      location: { ...base.data.location, latitude: -22.9 + i * 0.00001, longitude: -43.6 },
      reportedAt: i === 1 ? '2026-10-25T12:00:00Z' : `2026-10-2${i}T12:00:00Z`,
      evaluation: i === 1 ? undefined : { at: `2026-10-2${i}T12:00:00Z`, rating: 4, satisfied: true, reason: 'fixture' } };
    await pool.query('INSERT INTO records(id,kind,municipality_id,author_id,data,created_at) VALUES($1,$2,$3,$4,$5,$6)',
      [id, 'occurrence', base.municipality_id, base.author_id, data, `2026-10-2${i}T10:00:00Z`]);
    await pool.query('INSERT INTO demo_engagement(record_id,views,supports) VALUES($1,20,$2)', [id, i === 0 ? 10 : i]);
  }
  const get = async (suffix: string) => {
    const response = await app.inject({ headers, url: `/api/occurrences?search=${encodeURIComponent(prefix)}&limit=1&${suffix}` });
    assert.equal(response.statusCode, 200, response.body);
    return response.json().data as { id: string }[];
  };
  assert.equal((await get('order=votes'))[0].id, ids[0]);
  assert.equal((await get('order=votes&offset=1'))[0].id, ids[2]);
  assert.equal((await get('order=recent'))[0].id, ids[1]);
  assert.equal((await get('offset=0'))[0].id, ids[2], 'legacy default order remains compatible');
  assert.equal((await get('order=evaluated&evaluated=true&offset=1'))[0].id, ids[0]);
  assert.deepEqual(await get('status=pending'), []);
  const literal = await app.inject({ headers, url: '/api/occurrences?search=' + encodeURIComponent('literal % underscore _') });
  assert.equal(literal.statusCode, 200);
  assert.equal(literal.json().data.filter((r: { id: string }) => ids.includes(r.id)).length, 3);
  const summary = await app.inject({ headers, url: '/api/activity?summary=true' });
  assert.equal(summary.statusCode, 200, summary.body);
  const expected = (await pool.query("SELECT count(*)::int AS count FROM records WHERE author_id=$1 AND municipality_id='3304557' AND kind='occurrence'", [citizen.id])).rows[0].count;
  assert.equal(summary.json().data.counts.occurrences, expected);
  assert.deepEqual(summary.json().data.occurrences, []);
  assert.deepEqual(summary.json().data.items, []);
  const nearby = await app.inject({ headers, url: `/api/occurrences/${ids[0]}/nearby` });
  assert.equal(nearby.statusCode, 200, nearby.body);
  assert.deepEqual(nearby.json().data.slice(0, 2).map((row: { id: string }) => row.id), [ids[1], ids[2]]);
  assert.ok(nearby.json().data.length <= 4);
  assert.ok(!nearby.json().data.some((row: { id: string }) => row.id === ids[0]));
  const bulkIds = Array.from({ length: 501 }, (_, i) => prefix + '-summary-' + i);
  ids.push(...bulkIds);
  await pool.query(`INSERT INTO records(id,kind,municipality_id,author_id,data)
    SELECT id, 'occurrence', '3304557', $2, $3::jsonb || jsonb_build_object('id', id)
    FROM unnest($1::text[]) AS fixture(id)`, [bulkIds, citizen.id, base.data]);
  const fullSummary = await app.inject({ headers, url: '/api/activity?summary=true' });
  assert.equal(fullSummary.statusCode, 200);
  assert.equal(fullSummary.json().data.counts.occurrences, expected + 501, 'summary must count beyond the old 500-record cap');
});
