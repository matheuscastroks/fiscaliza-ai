const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const sample = {
  id: 'a',
  externalId: '1',
  source: 'rio1746',
  municipalityId: '3304557',
  serviceType: 'Iluminação',
  serviceSubtype: 'Lâmpada apagada',
  openedAt: '2026-10-01',
  importedAt: '2026-10-20',
  updatedAt: '2026-10-20',
};
function setup(storage) {
  const module = { exports: {} };
  const source = ts.transpileModule(
    fs.readFileSync('stores/followStore.ts', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  ).outputText;
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    Date,
    console,
    require: (name) =>
      name === '@react-native-async-storage/async-storage'
        ? storage
        : require(name),
  });
  return module.exports.useFollowStore;
}
test('saved calls survive restart and rapid toggles are serialized', async () => {
  let value = null;
  const storage = {
    getItem: async () => value,
    setItem: async (_, next) => {
      value = next;
    },
  };
  const store = setup(storage);
  await store.getState().toggleSavedCall(sample);
  const restarted = setup(storage);
  await restarted.getState().initialize();
  assert.equal(restarted.getState().savedCalls[0].id, 'a');
  await Promise.all([
    restarted.getState().toggleSavedCall(sample),
    restarted.getState().toggleSavedCall(sample),
  ]);
  assert.equal(JSON.parse(value).items.length, 1);
});
test('late hydration cannot overwrite a save', async () => {
  let resolve;
  const store = setup({
    getItem: () =>
      new Promise((r) => {
        resolve = r;
      }),
    setItem: async () => {},
  });
  const pending = store.getState().initialize();
  const save = store.getState().toggleSavedCall(sample);
  resolve(null);
  await Promise.all([pending, save]);
  assert.equal(store.getState().savedCalls.length, 1);
});
test('write failures retain saved content and allow retry', async () => {
  let fail = false;
  const store = setup({
    getItem: async () => null,
    setItem: async () => {
      if (fail) throw Error('quota');
    },
  });
  await store.getState().toggleSavedCall(sample);
  fail = true;
  assert.equal(await store.getState().clearSavedCalls(), false);
  assert.equal(store.getState().savedCalls.length, 1);
  assert.ok(store.getState().persistenceError);
  fail = false;
  assert.equal(await store.getState().clearSavedCalls(), true);
  assert.equal(store.getState().savedCalls.length, 0);
});
test('invalid storage recovers without accepting foreign source or municipality', async () => {
  const store = setup({
    getItem: async () => '{broken',
    setItem: async () => {},
  });
  await store.getState().initialize();
  assert.equal(store.getState().hydrated, true);
  assert.ok(store.getState().persistenceError);
  assert.equal(
    await store
      .getState()
      .toggleSavedCall({ ...sample, municipalityId: 'other' }),
    false,
  );
});
test('refresh does not resurrect removed calls or change save order', async () => {
  const store = setup({ getItem: async () => null, setItem: async () => {} });
  const other = { ...sample, id: 'b', externalId: '2' };
  await store.getState().toggleSavedCall(sample);
  await store.getState().toggleSavedCall(other);
  const savedAt = store.getState().metadata.b.savedAt;
  await store.getState().toggleSavedCall(sample);
  await store.getState().updateSnapshots([
    { ...sample, officialSituation: 'Encerrado' },
    { ...other, officialSituation: 'Encerrado' },
  ]);
  assert.equal(store.getState().savedCalls.length, 1);
  assert.equal(store.getState().savedCalls[0].id, 'b');
  assert.equal(store.getState().savedCalls[0].officialSituation, 'Encerrado');
  assert.equal(store.getState().metadata.b.savedAt, savedAt);
});
test('hydration deduplicates and rejects records from other municipalities', async () => {
  const store = setup({
    getItem: async () =>
      JSON.stringify({
        version: 1,
        items: [
          { call: sample },
          { call: sample },
          { call: { ...sample, id: 'foreign', municipalityId: 'other' } },
        ],
      }),
    setItem: async () => {},
  });
  await store.getState().initialize();
  assert.equal(store.getState().savedCalls.length, 1);
  assert.equal(store.getState().savedCalls[0].id, 'a');
});
test('saved calls are isolated per user account and municipality scope', async () => {
  const entries = new Map();
  const storage = {
    getItem: async (key) => entries.get(key) ?? null,
    setItem: async (key, next) => {
      entries.set(key, next);
    },
  };
  const store = setup(storage);
  await store.getState().setScope('user-1', '3304557');
  await store.getState().toggleSavedCall(sample);
  assert.equal(store.getState().savedCalls.length, 1);
  assert.ok(entries.has('fiscaliza-ai:saved:rio1746:user-1:3304557:v1'));

  await store.getState().setScope('user-2', '3304557');
  assert.equal(store.getState().savedCalls.length, 0);

  await store.getState().setScope('user-1', '3304557');
  assert.equal(store.getState().savedCalls.length, 1);
  assert.equal(store.getState().savedCalls[0].id, 'a');
});
