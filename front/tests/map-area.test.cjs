const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function load() {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('features/territory/mapArea.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInThisContext('(function(module,exports){' + code + '\n})')(module, module.exports);
  return module.exports;
}
function distance(a, b) {
  const rad = x => x * Math.PI / 180;
  const h = Math.sin(rad(b[1] - a[1]) / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(rad(b[0] - a[0]) / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(Math.min(1, h)));
}
test('map circles use geographic meters, close the ring and fit all vertices', () => {
  const { circleFeature, circleBounds } = load();
  for (const radiusMeters of [500, 1000, 2000, 5000]) {
    const area = { latitude: -22.91, longitude: -43.18, radiusMeters };
    const shape = circleFeature(area);
    const ring = shape.geometry.coordinates[0];
    assert.equal(ring.length, 97); assert.deepEqual(ring[0], ring.at(-1));
    const { northEast, southWest } = circleBounds(shape);
    for (const point of ring) {
      assert.ok(Math.abs(distance([-43.18, -22.91], point) - radiusMeters) < 0.001);
      assert.ok(point[0] >= southWest[0] && point[0] <= northEast[0]);
      assert.ok(point[1] >= southWest[1] && point[1] <= northEast[1]);
    }
  }
});
test('invalid coordinates never become a position marker or circle', () => {
  const { circleFeature, pointFeature } = load();
  assert.equal(circleFeature({ latitude: NaN, longitude: -43.2, radiusMeters: 1000 }), null);
  assert.equal(circleFeature({ latitude: -22.9, longitude: -43.2, radiusMeters: 0 }), null);
  assert.equal(circleFeature({ latitude: -22.9, longitude: -43.2, radiusMeters: -1 }), null);
  assert.equal(pointFeature({ latitude: 91, longitude: -43.2 }), null);
  assert.equal(pointFeature(null), null);
  assert.deepEqual(pointFeature({ latitude: 0, longitude: 0 }).geometry.coordinates, [0, 0]);
});
test('a saved place has its own center while the device point stays independent', () => {
  const { mapOverlayContext } = load();
  const location = { latitude: -22.95, longitude: -43.22, accuracyMeters: 35, capturedAt: 1 };
  const selection = { kind: 'radius', source: 'place', placeId: 'home', latitude: -22.91, longitude: -43.18, radiusMeters: 2000, neighborhood: null };
  const overlay = mapOverlayContext(selection, location, false);
  assert.equal(overlay.searchArea.latitude, -22.91);
  assert.equal(overlay.deviceLocation.latitude, -22.95);
  assert.equal(mapOverlayContext(selection, location, true).searchArea, null, 'bbox mode does not keep a misleading search circle');
  assert.equal(mapOverlayContext({ kind: 'neighborhood', name: 'Centro' }, location, false).searchArea, null);
  assert.equal(mapOverlayContext(selection, null, false).deviceLocation, null, 'a saved address never impersonates the device');
  const current = { ...selection, source: 'current', capturedAt: 10 };
  assert.equal(mapOverlayContext(current, { ...location, capturedAt: 20 }, false).searchArea.capturedAt, 10,
    'only an adopted capture requests a camera refit; a rejected fix may still update the device dot');
});
