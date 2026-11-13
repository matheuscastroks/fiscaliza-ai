import test from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { database } from '../src/db.js';
import { officialCalls } from '../src/schema.js';
import { queryOfficialMap } from '../src/official-call-map.js';

test('PostgreSQL: spatial aggregates cover every matching point independently of list pages', { skip: !process.env.DATABASE_URL }, async (t) => {
  const { db, pool } = database();
  t.after(async () => { await pool.query("DELETE FROM official_calls WHERE service_type='map-coverage-fixture'"); await pool.end(); });
  await pool.query(`INSERT INTO official_calls (id,external_id,service_type,service_subtype,opened_at,latitude,longitude)
    SELECT 'map-coverage-' || n, 'map-coverage-' || n, 'map-coverage-fixture','fixture',now(),
      CASE WHEN n > 600 THEN NULL ELSE -22.9 + (n % 20) * 0.0001 END,
      CASE WHEN n > 600 THEN NULL ELSE -43.2 + (n % 30) * 0.0001 END
    FROM generate_series(1,610) n`);
  const result = await queryOfficialMap(db, eq(officialCalls.serviceType, 'map-coverage-fixture'), { north: -22, south: -23, east: -43, west: -44 });
  assert.equal(result.total, 610);
  assert.equal(result.locatedTotal, 600);
  assert.equal(result.unlocatedTotal, 10);
  assert.equal(result.visibleTotal, 600);
  assert.equal(result.cells.reduce((sum, cell) => sum + cell.count, 0), 600);
  assert.ok(result.cells.length <= 1089);
  const outside = await queryOfficialMap(db, eq(officialCalls.serviceType, 'map-coverage-fixture'), { north: -20, south: -21, east: -43, west: -44 });
  assert.equal(outside.visibleTotal, 0);
  assert.equal(outside.total, 610);
  assert.deepEqual(outside.cells, []);
});

test('PostgreSQL: public map endpoint matches list filters and rejects pagination', { skip: !process.env.DATABASE_URL }, async (t) => {
  const { buildApp } = await import('../src/app.js');
  const { pool } = database();
  const app = await buildApp();
  t.after(async () => { await app.close(); await pool.query("DELETE FROM official_calls WHERE service_type='map-http-fixture'"); await pool.end(); });
  await pool.query(`INSERT INTO official_calls (id,external_id,service_type,service_subtype,opened_at,latitude,longitude,official_situation)
    VALUES ('map-http-a','map-http-a','map-http-fixture','lamp','2026-11-01',-22.9,-43.2,'Aberto'),
      ('map-http-b','map-http-b','map-http-fixture','lamp','2026-11-02',null,null,'Aberto'),
      ('map-http-c','map-http-c','map-http-fixture','lamp','2026-11-03',-22.9,-43.2,'Encerrado')`);
  const filters = 'tipo=map-http-fixture&situacao=Aberto&search=lamp';
  const viewport = '&viewNorth=-22&viewSouth=-23&viewEast=-43&viewWest=-44';
  const response = await app.inject('/api/rio1746/map?' + filters + viewport);
  assert.equal(response.statusCode, 200, response.body);
  const map = response.json().data;
  const list = await app.inject('/api/rio1746/calls?' + filters + '&limit=1');
  assert.equal(map.total, list.json().data.total);
  assert.equal(map.total, 2);
  assert.equal(map.visibleTotal, 1);
  assert.equal(map.unlocatedTotal, 1);
  for (const suffix of ['&limit=50','&cursor=x','&viewNorth=bad']) {
    assert.equal((await app.inject('/api/rio1746/map?' + filters + viewport + suffix)).statusCode, 400);
  }
  assert.equal((await app.inject('/api/rio1746/map?' + filters)).statusCode, 400);
});

test('map validates viewport before touching the database', async () => {
  const { buildApp } = await import('../src/app.js');
  const app = await buildApp({ databaseUrl: 'postgres://test:test@127.0.0.1:1/unavailable' });
  try {
    const response = await app.inject('/api/rio1746/map?limit=50');
    assert.equal(response.statusCode, 400, response.body);
  } finally { await app.close(); }
});
