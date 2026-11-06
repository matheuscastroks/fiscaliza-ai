import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRadiusFilter, radiusDistanceMeters } from '../src/official-call-radius.js';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';

test('radius requires a complete valid triple and excludes other geographic scopes', () => {
  assert.equal(parseRadiusFilter({}), undefined);
  const valid = { centerLatitude: '-22.91', centerLongitude: '-43.18', radiusMeters: '1000' };
  for (const radius of [500, 1000, 2000, 5000]) {
    assert.equal(parseRadiusFilter({ ...valid, radiusMeters: String(radius) })?.radiusMeters, radius);
  }
  for (const query of [
    { centerLatitude: '-22.91' }, { ...valid, centerLongitude: '' },
    { ...valid, centerLatitude: 'NaN' }, { ...valid, centerLatitude: 'Infinity' },
    { ...valid, centerLatitude: '91' }, { ...valid, centerLongitude: '-181' },
    { ...valid, radiusMeters: '1000m' }, { ...valid, radiusMeters: '750' },
    { ...valid, bairro: 'Centro' }, { ...valid, neighborhoodId: 'x' },
    { ...valid, north: '-22' },
  ]) assert.throws(() => parseRadiusFilter(query), { statusCode: 400 });
});

test('radius is applied before count and cursor pages and preserves neighborhood queries without coordinates', { skip: !process.env.DATABASE_URL }, async (t) => {
  const { pool } = database(); const app = await buildApp();
  t.after(async () => { await pool.query("DELETE FROM official_calls WHERE service_type='entorno-fixture'"); await app.close(); await pool.end(); });
  const lat = -22.91, lng = -43.18;
  const rows = [
    ['r1', lat, lng], ['r2', lat + 0.002, lng], ['r3', lat + 0.004, lng],
    ['corner', lat + 0.008, lng + 0.008], ['outside', lat + 0.02, lng], ['null', null, null],
  ];
  for (const [id, latitude, longitude] of rows) await pool.query(
    `INSERT INTO official_calls(id,external_id,service_type,service_subtype,opened_at,latitude,longitude,neighborhood_name)
     VALUES($1,$1,'entorno-fixture','fixture','2026-11-01T12:00:00Z',$2,$3,$4) ON CONFLICT(id) DO NOTHING`,
    [`entorno-fixture-${id}`, latitude, longitude, id === 'r3' ? 'Bairro vizinho fixture' : 'Entorno fixture'],
  );
  const url = `/api/rio1746/calls?tipo=entorno-fixture&centerLatitude=${lat}&centerLongitude=${lng}&radiusMeters=1000&limit=2`;
  const response = await app.inject({ url }); assert.equal(response.statusCode, 200, response.body);
  const first = response.json().data; assert.equal(first.total, 3); assert.equal(first.calls.length, 2);
  const second = (await app.inject({ url: url + '&cursor=' + first.nextCursor + '&includeTotal=false' })).json().data;
  assert.equal(second.calls.length, 1); assert.equal(second.hasMore, false); assert.equal(second.total, null);
  assert.equal(new Set([...first.calls, ...second.calls].map((x: { id: string }) => x.id)).size, 3);
  assert.ok([...first.calls, ...second.calls].some((x: { neighborhoodName: string }) => x.neighborhoodName === 'Bairro vizinho fixture'));
  assert.equal((await app.inject({ url: url.replace('radiusMeters=1000', 'radiusMeters=500') + '&cursor=' + first.nextCursor })).statusCode, 400);
  assert.equal((await app.inject({ url: url + '&bairro=Centro' })).statusCode, 400);
  assert.equal((await app.inject({ url: url.replace('centerLatitude=-22.91', 'centerLatitude=0') })).statusCode, 422);
  const neighborhood = (await app.inject({ url: '/api/rio1746/calls?tipo=entorno-fixture&bairro=Entorno%20fixture' })).json().data;
  assert.equal(neighborhood.total, 5); assert.ok(neighborhood.calls.some((x: { latitude: number | null }) => x.latitude === null));
});

test('distance uses geographic meters and excludes a bounding rectangle corner', () => {
  const origin = { latitude: -22.91, longitude: -43.18 };
  assert.equal(radiusDistanceMeters(origin, origin), 0);
  const north = { latitude: origin.latitude + 1000 / 6371000 * 180 / Math.PI, longitude: origin.longitude };
  assert.ok(Math.abs(radiusDistanceMeters(origin, north) - 1000) < 0.001);
  assert.ok(radiusDistanceMeters(origin, { latitude: north.latitude, longitude: origin.longitude + 0.009 }) > 1000);
});
