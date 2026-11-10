const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

class NetworkError extends Error {}
function load({ me, cache }) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('stores/authStore.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const storage = new Map(cache ? [['fiscaliza-ai:session-user:v1', JSON.stringify(cache)]] : []);
  vm.runInNewContext(source, {
    module, exports: module.exports, Date, Error, JSON,
    require: (name) => {
      if (name === 'zustand') return require(name);
      if (name === '@react-native-async-storage/async-storage')
        return { __esModule: true, default: { getItem: async (k) => storage.get(k) ?? null, setItem: async (k, v) => { storage.set(k, v); }, removeItem: async (k) => { storage.delete(k); } } };
      if (name === '@/services/auth') return { authApi: {} };
      if (name === '@/shared/profile-session') return { applyCurrentProfile: async () => true };
      if (name === '@/services/http')
        return { NetworkError, onSessionExpired() {}, queryClient: { clear() {}, cancelQueries: async () => {} }, request: me, restoreToken: async () => {}, saveToken: async () => {} };
      throw new Error(name);
    },
  });
  return module.exports.useAuthStore;
}

test('offline start keeps the cached session instead of turning anonymous', async () => {
  const store = load({ me: async () => { throw new NetworkError('offline'); }, cache: { id: 'u1' } });
  await store.getState().initialize();
  assert.equal(store.getState().isAuthenticated, true);
  assert.equal(store.getState().user.id, 'u1');
  assert.equal(store.getState().offline, true);
});

test('a rejected session (not a network failure) still signs the user out', async () => {
  const store = load({ me: async () => { throw new Error('401'); }, cache: { id: 'u1' } });
  await store.getState().initialize();
  assert.equal(store.getState().isAuthenticated, false);
  assert.equal(store.getState().user, null);
});

test('offline without a cached session stays anonymous', async () => {
  const store = load({ me: async () => { throw new NetworkError('offline'); } });
  await store.getState().initialize();
  assert.equal(store.getState().isAuthenticated, false);
});
