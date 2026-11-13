import test from 'node:test';
import assert from 'node:assert/strict';
import { spatialFeatures } from '../features/territory/spatialFeatures.ts';
test('spatial cells preserve full counts instead of reclustering cells as individual calls', () => {
  const shape = spatialFeatures([{ key: '1:1', id: null, count: 600, latitude: -22.9, longitude: -43.2, north: -22.8, south: -23, east: -43, west: -43.3 }]);
  assert.equal(shape.features.length, 1);
  assert.equal(shape.features[0].properties.count, 600);
  assert.deepEqual(shape.features[0].geometry.coordinates, [-43.2, -22.9]);
});
