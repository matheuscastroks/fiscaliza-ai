import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePointNeighborhood, resolveTerritoryLocation } from '../src/territory-location.js';
import type { ReadDatabase } from '../src/db.js';
import { buildApp } from '../src/app.js';
import type { Geometry } from '../src/municipality.js';
const geometry: Geometry = { type: 'Polygon', coordinates: [[[0,0],[2,0],[2,2],[0,2],[0,0]], [[0.5,0.5],[1.5,0.5],[1.5,1.5],[0.5,1.5],[0.5,0.5]]] };
test('missing municipal geometry is unavailable rather than an invented neighborhood', async () => {
  const db = { select: () => ({ from: () => ({ where: async () => [] }) }) } as unknown as ReadDatabase;
  await assert.rejects(resolveTerritoryLocation(db, { latitude: -22.9, longitude: -43.2 }), { statusCode: 503 });
});
test('resolving a neighborhood respects holes, absence and ambiguous boundaries', () => {
  const boundaries = [{ id: 'a', name: 'A', geometry }];
  assert.deepEqual(resolvePointNeighborhood({ latitude: 0.2, longitude: 0.2 }, boundaries), { id: 'a', name: 'A' });
  assert.equal(resolvePointNeighborhood({ latitude: 1, longitude: 1 }, boundaries), null);
  assert.equal(resolvePointNeighborhood({ latitude: 3, longitude: 3 }, boundaries), null);
  assert.equal(resolvePointNeighborhood({ latitude: 0.2, longitude: 0.2 }, [...boundaries, { id: 'b', name: 'B', geometry }]), null);
});
test('public resolution rejects invalid queries and returns an explicit outside municipality state', { skip: !process.env.DATABASE_URL }, async (t) => {
  const app = await buildApp(); t.after(() => app.close());
  for (const query of ['', '?latitude=NaN&longitude=0', '?latitude=0', '?latitude=91&longitude=0']) {
    assert.equal((await app.inject({ url: '/api/territory/resolve' + query })).statusCode, 400);
  }
  const result = await app.inject({ url: '/api/territory/resolve?latitude=0&longitude=0' });
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json().data, { municipalityId: '3304557', insideMunicipality: false, neighborhood: null });
});
