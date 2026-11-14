const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

function load(deleteAccount, storage = new Map()) {
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
        return {
          __esModule: true,
          default: {
            setItem: async (key, value) => storage.set(key, value),
            getItem: async (key) => storage.get(key) ?? null,
            removeItem: async (key) => storage.delete(key),
            getAllKeys: async () => [...storage.keys()],
            multiRemove: async (keys) => keys.forEach((key) => storage.delete(key)),
          },
        };
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

  const result = await store.getState().deleteAccount('Senha-123');

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

  const result = await store.getState().deleteAccount('Senha-123');

  assert.equal(result.success, true);
  assert.equal(store.getState().isAuthenticated, false);
  assert.equal(store.getState().user, null);
  assert.equal(store.getState().isLoading, false);
});

test('apagar a conta envia a senha e apaga deste aparelho os dados dela', async () => {
  const storage = new Map([
    ['fiscaliza-ai:saved:rio1746:citizen-1:3304557:v1', '[]'],
    ['fiscaliza-ai:places:citizen-1:3304557:v1', '{}'],
    ['fiscaliza-avatar:citizen-1', 'file://foto'],
    ['fiscaliza-ai:places:anonymous:3304557:v1', '{}'],
    ['fiscaliza-ai:saved:rio1746:outra-conta:3304557:v1', '[]'],
  ]);
  const passwords = [];
  const store = load(async (password) => {
    passwords.push(password);
    return { success: true };
  }, storage);
  store.setState({ user: { id: 'citizen-1' }, isAuthenticated: true, isLoading: false });

  await store.getState().deleteAccount('Senha-123');

  assert.deepEqual(passwords, ['Senha-123']);
  assert.deepEqual([...storage.keys()].sort(), [
    'fiscaliza-ai:places:anonymous:3304557:v1',
    'fiscaliza-ai:saved:rio1746:outra-conta:3304557:v1',
  ]);
});
