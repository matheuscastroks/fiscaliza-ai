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
function setupExports(storage) {
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
        : name === './scopedPersistence'
          ? require('@/stores/scopedPersistence')
          : name === '@/features/city/municipalityId'
            ? require(name)
            : require(name),
  });
  return module.exports;
}
function setup(storage) {
  return setupExports(storage).useFollowStore;
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
test('a delayed write cannot reach the next account scope', async () => {
  let release;
  let started;
  const writeStarted = new Promise((resolve) => {
    started = resolve;
  });
  const pendingWrite = new Promise((resolve) => {
    release = resolve;
  });
  const entries = new Map();
  let writes = 0;
  const storage = {
    getItem: async (key) => entries.get(key) ?? null,
    setItem: async (key, next) => {
      writes += 1;
      if (writes === 1) {
        started();
        await pendingWrite;
      }
      entries.set(key, next);
    },
  };
  const store = setup(storage);
  await store.getState().setScope('user-1', '3304557');
  const saving = store.getState().toggleSavedCall(sample);
  await writeStarted;
  await store.getState().setScope('user-2', '3304557');
  release();
  assert.equal(await saving, false);
  assert.equal(store.getState().userId, 'user-2');
  assert.equal(store.getState().savedCalls.length, 0);
  assert.equal(
    entries.has('fiscaliza-ai:saved:rio1746:user-2:3304557:v1'),
    false,
  );
});
test('follow notifications only fire after the write is confirmed', async () => {
  let fail = false;
  const exports = setupExports({
    getItem: async () => null,
    setItem: async () => {
      if (fail) throw Error('storage unavailable');
    },
  });
  const store = exports.useFollowStore;
  const events = [];
  exports.setFollowNotificationListener((call, saved) => {
    events.push({ id: call.id, saved });
  });

  fail = true;
  assert.equal(await store.getState().toggleSavedCall(sample), false);
  assert.equal(store.getState().savedCalls.length, 0);
  assert.deepEqual(events, []);
  assert.ok(store.getState().persistenceError);

  fail = false;
  assert.equal(await store.getState().toggleSavedCall(sample), true);
  assert.deepEqual(events, [{ id: 'a', saved: true }]);

  fail = true;
  assert.equal(await store.getState().clearSavedCalls(), false);
  assert.equal(store.getState().savedCalls.length, 1);
  assert.deepEqual(events, [{ id: 'a', saved: true }]);

  fail = false;
  assert.equal(await store.getState().clearSavedCalls(), true);
  assert.deepEqual(events, [
    { id: 'a', saved: true },
    { id: 'a', saved: false },
  ]);
});

function memoryStorage() {
  const data = new Map();
  return {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => void data.set(key, value),
    removeItem: async (key) => void data.delete(key),
    keys: () => [...data.keys()],
  };
}
function fakeAccount() {
  const server = new Map();
  const api = {
    offline: false,
    merged: [],
    list: async () => {
      if (api.offline) throw new Error('offline');
      return [...server.values()].map((call) => ({ call, savedAt: '2026-11-01T00:00:00.000Z' }));
    },
    merge: async (ids) => {
      if (api.offline) throw new Error('offline');
      api.merged.push(...ids);
      for (const id of ids) server.set(id, { ...sample, id });
    },
    remove: async (id) => {
      if (api.offline) throw new Error('offline');
      server.delete(id);
    },
    clear: async () => {
      if (api.offline) throw new Error('offline');
      server.clear();
    },
    server,
  };
  return api;
}

test('saved calls follow the account: anonymous list is adopted and another device sees it', async () => {
  const storage = memoryStorage();
  const account = fakeAccount();
  const first = setupExports(storage);
  first.setSavedCallsAccountApi(account);
  await first.useFollowStore.getState().setScope(null);
  await first.useFollowStore.getState().toggleSavedCall(sample);
  await first.useFollowStore.getState().setScope('user-1');
  assert.deepEqual([...account.merged], ['a']);
  assert.equal(first.useFollowStore.getState().savedCalls[0].id, 'a');
  assert.equal(storage.keys().some((key) => key.includes(':saved:') && !key.includes('user-1')), false);

  // Outro aparelho: armazenamento vazio, mesma conta.
  const second = setupExports(memoryStorage());
  second.setSavedCallsAccountApi(account);
  await second.useFollowStore.getState().setScope('user-1');
  assert.deepEqual([...second.useFollowStore.getState().savedCalls.map((c) => c.id)], ['a']);
});

test('saved calls changed offline stay pending and reach the account later', async () => {
  const storage = memoryStorage();
  const account = fakeAccount();
  const mod = setupExports(storage);
  mod.setSavedCallsAccountApi(account);
  const store = mod.useFollowStore;
  await store.getState().setScope('user-1');
  account.offline = true;
  await store.getState().toggleSavedCall(sample);
  assert.equal(store.getState().savedCalls.length, 1);
  assert.deepEqual([...store.getState().pending.add], ['a']);
  assert.equal(account.server.size, 0);

  account.offline = false;
  assert.equal(await store.getState().syncWithAccount(), true);
  assert.equal(account.server.has('a'), true);
  assert.deepEqual(JSON.parse(JSON.stringify(store.getState().pending)), { clear: false, add: [], remove: [] });

  await store.getState().toggleSavedCall(sample); // desfaz
  await store.getState().syncWithAccount();
  assert.equal(account.server.size, 0);
  assert.equal(store.getState().savedCalls.length, 0);
});
