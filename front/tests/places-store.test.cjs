const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
function load(storage) {
  const cache = new Map();
  function read(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} }; cache.set(file, mod);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    vm.runInThisContext('(function(require,module,exports){' + source + '\n})')((name) => {
      if (name === '@react-native-async-storage/async-storage') return { __esModule: true, default: storage };
      if (name === 'zustand') return require('zustand');
      if (name === 'react' || name === '@/features/territory/usePublicData' || name === '@/features/territory/selectors') return {};
      if (name.startsWith('.')) return read(path.resolve(path.dirname(file), name + '.ts'));
      throw new Error(name);
    }, mod, mod.exports);
    return mod.exports;
  }
  const store = read('stores/placesStore.ts').usePlacesStore;
  store.loadTerritory = () => read('stores/territoryStore.ts').useTerritoryStore;
  return store;
}
test('places survive restart, failed saves do not succeed, and current coordinates never persist', async () => {
  const values = new Map(); let fail = false;
  const storage = { getItem: async k => values.get(k) || null, setItem: async (k,v) => { if (fail) throw Error('disk'); values.set(k,v); } };
  let store = load(storage);
  await store.getState().setScope(null, '3304557');
  const place = { name: 'Casa', addressLabel: '', latitude: -22.9, longitude: -43.2, radiusMeters: 1000, neighborhood: null };
  assert.equal(await store.getState().createPlace(place), true);
  const id = store.getState().places[0].id;
  await store.getState().selectPlace(id);
  store = load(storage); await store.getState().setScope(null, '3304557');
  assert.equal(store.getState().selection.placeId, id);
  fail = true;
  assert.equal(await store.getState().createPlace({ ...place, name: 'Trabalho' }), false);
  assert.equal(store.getState().places.length, 1);
  fail = false;
  store.getState().setCurrentLocation({ latitude: -22.9999, longitude: -43.3333, accuracyMeters: 30, capturedAt: 1 }, null);
  await store.getState().setRadius(500);
  assert.ok(![...values.values()].some(v => v.includes('-22.9999')));
  const restarted = load(storage); await restarted.getState().setScope(null, '3304557');
  assert.equal(restarted.getState().selection.kind, 'pending-current');
  assert.equal(restarted.getState().selection.radiusMeters, 500);
});
test('scope changes isolate places and ignore a delayed old write', async () => {
  let release; let delay = false;
  const values = new Map();
  const store = load({ getItem: async k => values.get(k) || null, setItem: async (k,v) => { if (delay) await new Promise(r => { release = r; }); values.set(k,v); } });
  await store.getState().setScope('a', '3304557');
  delay = true;
  const pending = store.getState().createPlace({ name: 'Casa', addressLabel: '', latitude: -22.9, longitude: -43.2, radiusMeters: 1000, neighborhood: null });
  await new Promise(r => setImmediate(r));
  await store.getState().setScope('b', '3304557');
  release(); await pending;
  assert.equal(store.getState().places.length, 0);
  assert.equal(store.getState().userId, 'b');
});
test('a pending preference write does not overwrite a newer device location', async () => {
  let release;
  const store = load({ getItem: async () => null, setItem: async () => new Promise(r => { release = r; }) });
  await store.getState().setScope(null, '3304557');
  const pending = store.getState().dismissPrompt();
  await new Promise(r => setImmediate(r));
  store.getState().setCurrentLocation({ latitude: -22.99, longitude: -43.3, accuracyMeters: 20, capturedAt: 1 }, null);
  release(); await pending;
  assert.equal(store.getState().selection.kind, 'radius');
  assert.equal(store.getState().selection.latitude, -22.99);
});
test('a legacy region write cannot update the next user scope', async () => {
  let release; let delay = false;
  const store = load({ getItem: async () => null, setItem: async () => { if (delay) await new Promise(r => { release = r; }); } });
  const region = store.loadTerritory();
  await store.getState().setScope('a', '3304557'); await region.getState().setScope('a', '3304557');
  delay = true; const pending = region.getState().setPreferredNeighborhood('Centro');
  await new Promise(r => setImmediate(r));
  await store.getState().setScope('b', '3304557'); await region.getState().setScope('b', '3304557');
  release(); assert.equal(await pending, false);
  assert.equal(region.getState().preferredNeighborhood, '');
  assert.equal(store.getState().selection.kind, 'municipality');
});
test('a radius saved during a new capture keeps the latest point and the confirmed radius together', async () => {
  let release, delayed = false;
  const store = load({ getItem: async () => null, setItem: async () => { if (delayed) await new Promise(r => { release = r; }); } });
  await store.getState().setScope(null, '3304557');
  store.getState().setCurrentLocation({ latitude: -22.9, longitude: -43.2, accuracyMeters: 20, capturedAt: 1 }, null);
  await new Promise(r => setImmediate(r));
  delayed = true; const pending = store.getState().setRadius(500);
  await new Promise(r => setImmediate(r));
  store.getState().setCurrentLocation({ latitude: -22.99, longitude: -43.3, accuracyMeters: 20, capturedAt: 2 }, null);
  delayed = false; release(); await pending;
  assert.equal(store.getState().selection.latitude, -22.99);
  assert.equal(store.getState().selection.radiusMeters, 500);
  assert.equal(store.getState().currentRadius, 500);
});
test('the device fix survives place selection and pending writes, but never restart or a scope change', async () => {
  const values = new Map(); let release, delayed = false;
  const storage = { getItem: async k => values.get(k) || null, setItem: async (k, v) => { if (delayed) await new Promise(r => { release = r; }); values.set(k, v); } };
  const store = load(storage); await store.getState().setScope('a', '3304557');
  const point = { latitude: -22.987654, longitude: -43.2, accuracyMeters: 35, capturedAt: 1 };
  delayed = true; const pending = store.getState().dismissPrompt();
  await new Promise(r => setImmediate(r));
  store.getState().recordDeviceLocation(point);
  delayed = false; release(); await pending;
  await store.getState().createPlace({ name: 'Casa', addressLabel: '', latitude: -22.91, longitude: -43.18, radiusMeters: 1000, neighborhood: null });
  await store.getState().selectPlace(store.getState().places[0].id);
  assert.equal(store.getState().deviceLocation.latitude, point.latitude);
  assert.ok(![...values.values()].some(v => v.includes('-22.987654')));
  const restarted = load(storage); await restarted.getState().setScope('a', '3304557');
  assert.equal(restarted.getState().deviceLocation, null);
  await store.getState().setScope('b', '3304557');
  assert.equal(store.getState().deviceLocation, null);
});
