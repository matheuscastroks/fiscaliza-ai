const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

function load(deleteAccount) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('stores/authStore.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const queryClient = { clear() {}, cancelQueries: async () => {} };
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    Date,
    Error,
    console,
    require: (name) => {
      if (name === 'zustand') return require(name);
      if (name === '@react-native-async-storage/async-storage')
        return { default: { setItem: async () => {}, getItem: async () => null, removeItem: async () => {} } };
      if (name === '@/services/auth') return { authApi: { deleteAccount } };
      if (name === '@/shared/profile-session')
        return { applyCurrentProfile: async () => true };
      if (name === '@/services/http')
        return {
          onSessionExpired() {},
          queryClient,
          request: async () => ({}),
          restoreToken: async () => {},
          saveToken: async () => {},
        };
      throw new Error(`Unexpected module ${name}`);
    },
  });
  return module.exports.useAuthStore;
}

test('failed account deletion keeps the session and finishes loading', async () => {
  const store = load(async () => ({
    success: false,
    error: 'Service unavailable',
  }));
  store.setState({
    user: { id: 'citizen' },
    isAuthenticated: true,
    isLoading: false,
  });

  const result = await store.getState().deleteAccount();

  assert.equal(result.success, false);
  assert.equal(store.getState().isAuthenticated, true);
  assert.equal(store.getState().user?.id, 'citizen');
  assert.equal(store.getState().isLoading, false);
});

test('successful account deletion clears the local session', async () => {
  const store = load(async () => ({ success: true }));
  store.setState({
    user: { id: 'citizen' },
    isAuthenticated: true,
    isLoading: false,
  });

  const result = await store.getState().deleteAccount();

  assert.equal(result.success, true);
  assert.equal(store.getState().isAuthenticated, false);
  assert.equal(store.getState().user, null);
  assert.equal(store.getState().isLoading, false);
});
