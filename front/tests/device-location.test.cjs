const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
function load() {
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('features/places/deviceLocation.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInThisContext('(function(module,exports){' + source + '\n})')(mod, mod.exports);
  return mod.exports.captureDeviceLocation;
}
test('capture is explicit, permission denial never requests position, and timeout is recoverable', async () => {
  const capture = load(); let positions = 0;
  const device = { hasServicesEnabledAsync: async () => true, requestForegroundPermissionsAsync: async () => ({ granted: false }), getCurrentPositionAsync: async () => { positions++; return { coords: { latitude: -22.9, longitude: -43.2, accuracy: 30 } }; } };
  assert.equal(positions, 0);
  await assert.rejects(capture(device, new AbortController().signal), /autorizada/);
  assert.equal(positions, 0);
  device.requestForegroundPermissionsAsync = async () => ({ granted: true });
  const result = await capture(device, new AbortController().signal);
  assert.equal(result.accuracyMeters, 30);
  device.getCurrentPositionAsync = () => new Promise(() => {});
  await assert.rejects(capture(device, new AbortController().signal, 5), /demorou/);
});
test('canceling a capture rejects before a late position can replace a selection', async () => {
  const capture = load(); const controller = new AbortController();
  const pending = capture({ hasServicesEnabledAsync: async () => true, requestForegroundPermissionsAsync: async () => ({ granted: true }), getCurrentPositionAsync: () => new Promise(() => {}) }, controller.signal);
  controller.abort();
  await assert.rejects(pending, /cancelada/);
});
test('a permission granted after timeout cannot start a late position request', async () => {
  const capture = load(); let release, requests = 0;
  const pending = capture({ hasServicesEnabledAsync: async () => true, requestForegroundPermissionsAsync: () => new Promise(r => { release = r; }), getCurrentPositionAsync: async () => { requests++; } }, new AbortController().signal, 5);
  await assert.rejects(pending, /demorou/);
  release({ granted: true }); await new Promise(r => setImmediate(r));
  assert.equal(requests, 0);
});
