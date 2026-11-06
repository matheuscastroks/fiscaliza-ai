const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function setup(storage) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('stores/territoryStore.ts', 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      require: (name) =>
        name === './placesStore' ? { usePlacesStore: { getState: () => ({ userId: null, municipalityId: '3304557', selectNeighborhood: async () => true }) } } : name === '@react-native-async-storage/async-storage'
          ? storage
          : name.startsWith('@/')
            ? {}
            : require(name),
    },
  );
  return module.exports.useTerritoryStore;
}
test('preferred neighborhood survives restart without persisting temporary exploration', async () => {
  let value = null;
  const storage = {
    getItem: async () => value,
    setItem: async (_, next) => {
      value = next;
    },
  };
  const store = setup(storage);
  await store.getState().setPreferredNeighborhood('Centro');
  store.getState().setNeighborhood('Santa Cruz');
  const restarted = setup(storage);
  await restarted.getState().initialize();
  assert.equal(restarted.getState().preferredNeighborhood, 'Centro');
  assert.equal(restarted.getState().neighborhood, '');
  assert.equal(restarted.getState().layers[0], 'official');
});
test('region storage failure preserves preference and late read preserves explicit selection', async () => {
  let resolve;
  let fail = false;
  const store = setup({
    getItem: () =>
      new Promise((r) => {
        resolve = r;
      }),
    setItem: async () => {
      if (fail) throw Error('quota');
    },
  });
  const initial = store.getState().initialize();
  const selection = store.getState().setPreferredNeighborhood('Centro');
  resolve(JSON.stringify({ version: 1, neighborhood: 'Santa Cruz' }));
  await Promise.all([initial, selection]);
  assert.equal(store.getState().preferredNeighborhood, 'Centro');
  fail = true;
  assert.equal(
    await store.getState().setPreferredNeighborhood('Tijuca'),
    false,
  );
  assert.equal(store.getState().preferredNeighborhood, 'Centro');
  assert.ok(store.getState().persistenceError);
});
