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
