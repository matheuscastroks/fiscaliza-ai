import test from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';

test(
  'theme filter resolves distinct service types on the server',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { pool } = database();
    const app = await buildApp();
    const fixtureTypes = [
      'Iluminação tema-fixture',
      'Tapa-buraco tema-fixture',
    ];
    t.after(async () => {
      await pool.query(
        'DELETE FROM official_calls WHERE service_type = ANY($1::text[])',
        [fixtureTypes],
      );
      await app.close();
      await pool.end();
    });
    for (const [id, serviceType] of [
      ['theme-fixture-lighting', fixtureTypes[0]],
      ['theme-fixture-road', fixtureTypes[1]],
    ]) {
      await pool.query(
        `INSERT INTO official_calls(id, external_id, service_type, service_subtype, opened_at)
        VALUES($1,$2,$3,'fixture','2026-10-20T10:00:00Z')
        ON CONFLICT(id) DO NOTHING`,
        [id, id, serviceType],
      );
    }

    const lighting = await app.inject({
      url: '/api/rio1746/calls?tema=lighting&search=tema-fixture',
    });
    assert.equal(lighting.statusCode, 200, lighting.body);
    assert.deepEqual(
      lighting.json().data.calls.map((call: { id: string }) => call.id),
      ['theme-fixture-lighting'],
    );

    const combined = await app.inject({
      url:
        '/api/rio1746/calls?tema=lighting&tipo=' +
        encodeURIComponent(fixtureTypes[1]),
    });
    assert.equal(combined.statusCode, 200, combined.body);
    assert.equal(combined.json().data.total, 0);

    const invalid = await app.inject({
      url: '/api/rio1746/calls?tema=nao-existe',
    });
    assert.equal(invalid.statusCode, 400);

    const overview = await app.inject({
      url: '/api/rio1746/overview?tema=nao-existe',
    });
    assert.equal(overview.statusCode, 400);
  },
);
