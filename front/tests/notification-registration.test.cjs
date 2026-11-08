const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, Error,
    require: (name) => dependencies[name] || require(name),
  });
  return module.exports;
}

function service({ registrationFails = false, tokenFails = false } = {}) {
  return load('features/notifications/notificationService.ts', {
    'react-native': { Platform: { OS: 'android' } },
    'expo-device': { isDevice: true },
    'expo-notifications': {
      setNotificationHandler() {},
      AndroidImportance: { HIGH: 4 },
      setNotificationChannelAsync: async () => {},
      getPermissionsAsync: async () => ({ status: 'granted' }),
      getExpoPushTokenAsync: async () => {
        if (tokenFails) throw new Error('Token unavailable');
        return { data: 'test-token' };
      },
    },
    '@/services/http': { request: async () => {
      if (registrationFails) throw new Error('Server unavailable');
      return {};
    } },
  });
}

test('push activation rejects when the server has not registered the token', async () => {
  await assert.rejects(service({ registrationFails: true }).registerForPushNotificationsAsync(), /registrar/i);
});

test('push token errors reach the caller so activation can be retried', async () => {
  await assert.rejects(service({ tokenFails: true }).registerForPushNotificationsAsync(), /Token unavailable/);
});

function store({ status = 'granted', register = async () => 'test-token' } = {}) {
  return load('stores/notificationStore.ts', {
    'expo-notifications': { getPermissionsAsync: async () => ({ status }) },
    '@/features/notifications/notificationService': {
      registerForPushNotificationsAsync: register,
      sendTestPushNotification: async () => ({ success: true }),
      followCallForNotifications() {},
    },
    './followStore': {
      useFollowStore: { getState: () => ({ savedCalls: [] }) },
      setFollowNotificationListener() {},
    },
  }).useNotificationStore;
}

test('permission alone does not report push activation success', async () => {
  const state = store({ register: async () => null });
  assert.equal(await state.getState().requestPermissions(), false);
  assert.equal(state.getState().permissionGranted, true);
  assert.equal(state.getState().pushToken, null);
  assert.ok(state.getState().error);
  assert.equal(state.getState().isLoading, false);
});

test('registration failure retains OS permission and exposes a retryable error', async () => {
  const state = store({ register: async () => { throw new Error('Registration failed'); } });
  assert.equal(await state.getState().requestPermissions(), false);
  assert.equal(state.getState().permissionGranted, true);
  assert.ok(state.getState().error);
  assert.equal(state.getState().isLoading, false);
});

test('revoking permission removes a stale push token and disables test pushes', async () => {
  const state = store({ status: 'denied' });
  state.setState({ pushToken: 'stale-token', permissionGranted: true });
  await state.getState().initialize();
  assert.equal(state.getState().pushToken, null);
  assert.equal(state.getState().permissionGranted, false);
  assert.equal(await state.getState().sendTestPush(), false);
});

test('successful registration activates pushes and clears a previous error', async () => {
  const state = store();
  state.setState({ error: 'Previous failure' });
  assert.equal(await state.getState().requestPermissions(), true);
  assert.equal(state.getState().pushToken, 'test-token');
  assert.equal(state.getState().error, null);
});
