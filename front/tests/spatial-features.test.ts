import test from 'node:test';
import assert from 'node:assert/strict';
import { spatialFeatures, spatialSelection } from '../features/territory/spatialFeatures.ts';
test('spatial cells preserve full counts instead of reclustering cells as individual calls', () => {
  const shape = spatialFeatures([{ key: '1:1', id: null, count: 600, latitude: -22.9, longitude: -43.2, north: -22.8, south: -23, east: -43, west: -43.3 }]);
  assert.equal(shape.features.length, 1);
  assert.equal(shape.features[0].properties.count, 600);
  assert.deepEqual(shape.features[0].geometry.coordinates, [-43.2, -22.9]);
});


test('a native cluster opens its combined extent and retains the call count, not point_count', () => {
  const selection = spatialSelection({
    geometry: { coordinates: [-43.2, -22.9] },
    properties: { cluster: true, cluster_id: 8, count: 14205,
      north: -22.7, south: -23.1, east: -43.1, west: -43.8 },
  });
  assert.deepEqual(selection, { key: 'cluster:8', id: null, count: 14205,
    longitude: -43.2, latitude: -22.9, north: -22.7, south: -23.1, east: -43.1, west: -43.8 });
});

test('singleton selection preserves the call id; empty map taps do nothing', () => {
  const cell = { key: '1:1', id: 'call-outside-list', count: 1, latitude: -22.9, longitude: -43.2,
    north: -22.9, south: -22.9, east: -43.2, west: -43.2 };
  assert.deepEqual(spatialSelection({ properties: cell }), cell);
  assert.equal(spatialSelection(undefined), null);
});
