import test from 'node:test';
import assert from 'node:assert/strict';
import { belongsToSpatialCluster, spatialFeatures, spatialSelection } from '../features/territory/spatialFeatures.ts';
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

test('a nearby call inside the envelope is excluded when it belongs to no selected cell', () => {
  const selection = {
    key: 'cluster:8', id: null, count: 2, longitude: -43.5, latitude: -23,
    north: -22.8, south: -23.2, east: -43.2, west: -43.8,
    members: [
      { north: -22.8, south: -22.9, east: -43.2, west: -43.3 },
      { north: -23.1, south: -23.2, east: -43.7, west: -43.8 },
    ],
  };
  assert.equal(belongsToSpatialCluster({ latitude: -23, longitude: -43.5 }, selection), false);
  assert.equal(belongsToSpatialCluster({ latitude: -22.9, longitude: -43.3 }, selection), true);
  assert.equal(belongsToSpatialCluster({ latitude: null, longitude: -43.3 }, selection), false);
});
