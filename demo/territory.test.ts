import assert from 'node:assert/strict';
import test from 'node:test';
import { distanceMeters, inMapRegion } from '../shared/territory.ts';

test('distância geográfica distingue a mesma esquina de outro bairro', () => {
  const origin = { latitude: -22.903, longitude: -43.185 };
  assert.equal(distanceMeters(origin, origin), 0);
  assert.ok(
    distanceMeters(origin, { latitude: -22.904, longitude: -43.186 }) < 180,
  );
  assert.ok(
    distanceMeters(origin, { latitude: -22.95, longitude: -43.22 }) > 4000,
  );
});

test('contagem na área acompanha os limites do mapa, incluindo a borda', () => {
  const region = {
    latitude: 0,
    longitude: 0,
    latitudeDelta: 2,
    longitudeDelta: 2,
  };
  assert.equal(inMapRegion({ latitude: 1, longitude: -1 }, region), true);
  assert.equal(inMapRegion({ latitude: 1.01, longitude: 0 }, region), false);
});
