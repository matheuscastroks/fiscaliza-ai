import { test } from 'node:test';
import assert from 'node:assert/strict';
import { containsPoint, parseGeometry, type Geometry } from '../src/municipality.js';
const shape: Geometry = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ],
    [
      [3, 3],
      [7, 3],
      [7, 7],
      [3, 7],
      [3, 3],
    ],
  ],
};
test('municipal geography handles boundary, holes and MultiPolygon without bounding-box acceptance', () => {
  assert.equal(containsPoint(shape, 1, 1), true);
  assert.equal(containsPoint(shape, 5, 5), false);
  assert.equal(containsPoint(shape, 3, 5), true);
  assert.equal(containsPoint(shape, 0, 5), true);
  assert.equal(containsPoint(shape, 11, 5), false);
  const multi: Geometry = {
    type: 'MultiPolygon',
    coordinates: [
      shape.coordinates,
      [
        [
          [20, 20],
          [21, 20],
          [21, 21],
          [20, 21],
          [20, 20],
        ],
      ],
    ],
  };
  assert.equal(containsPoint(multi, 20.5, 20.5), true);
  assert.equal(containsPoint(multi, 15, 15), false);
  assert.throws(
    () => parseGeometry({ type: 'Polygon', coordinates: [] }),
    /municipal/,
  );
});
