const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(
  fs.readFileSync('stores/themeStore.ts', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  },
).outputText;
function setup({ saved = null, read, write, system = 'light' } = {}) {
  const listeners = [];
  const savedWrites = [];
  const storage = {
    getItem: read || (async () => saved),
    setItem: async (key, value) => {
      savedWrites.push([key, value]);
      if (write) await write(key, value);
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require: (name) =>
      name === 'react-native'
        ? {
            Appearance: {
              getColorScheme: () => system,
              addChangeListener: (listener) => listeners.push(listener),
            },
          }
        : name === '@react-native-async-storage/async-storage'
          ? storage
          : require(name),
  });
  return { ...module.exports, listeners, savedWrites };
}
require('node:test')(
  'theme persistence, system changes and hydration races',
  async () => {
    let checks = 0;
    const valid = setup();
    for (const value of ['system', 'light', 'dark'])
      assert(valid.isThemePreference(value));
    for (const value of ['LIGHT', '', null, {}, 0])
      assert(!valid.isThemePreference(value));
    assert.equal(valid.resolveThemeMode('system', 'dark'), 'dark');
    assert.equal(valid.resolveThemeMode('light', 'dark'), 'light');
    checks++;

    const saved = setup({ saved: 'dark' });
    await saved.useThemeStore.getState().initialize();
    assert.equal(saved.useThemeStore.getState().preference, 'dark');
    assert.equal(saved.useThemeStore.getState().hydrated, true);
    assert.equal(saved.listeners.length, 1);
    await saved.useThemeStore.getState().initialize();
    assert.equal(saved.listeners.length, 1);
    checks++;

    saved.listeners[0]({ colorScheme: 'dark' });
    await saved.useThemeStore.getState().setPreference('light');
    assert.equal(saved.useThemeStore.getState().systemMode, 'dark');
    assert.equal(
      saved.resolveThemeMode(
        saved.useThemeStore.getState().preference,
        saved.useThemeStore.getState().systemMode,
      ),
      'light',
    );
    await saved.useThemeStore.getState().setPreference('system');
    assert.equal(
      saved.resolveThemeMode(
        saved.useThemeStore.getState().preference,
        saved.useThemeStore.getState().systemMode,
      ),
      'dark',
    );
    checks++;

    let resolveRead;
    const race = setup({
      read: () =>
        new Promise((resolve) => {
          resolveRead = resolve;
        }),
    });
    const initializing = race.useThemeStore.getState().initialize();
    await race.useThemeStore.getState().setPreference('light');
    resolveRead('dark');
    await initializing;
    assert.equal(race.useThemeStore.getState().preference, 'light');
    checks++;

    const ordered = setup();
    await Promise.all(
      ['dark', 'light', 'system'].map((value) =>
        ordered.useThemeStore.getState().setPreference(value),
      ),
    );
    assert.deepEqual(
      ordered.savedWrites.map((entry) => entry[1]),
      ['dark', 'light', 'system'],
    );
    assert.equal(ordered.useThemeStore.getState().preference, 'system');
    checks++;

    const failed = setup({
      write: async () => {
        throw new Error('storage full');
      },
    });
    await failed.useThemeStore.getState().setPreference('dark');
    assert.equal(failed.useThemeStore.getState().preference, 'dark');
    assert(failed.useThemeStore.getState().persistenceError);
    const failedRead = setup({
      read: async () => {
        throw new Error('read denied');
      },
    });
    await failedRead.useThemeStore.getState().initialize();
    assert.equal(failedRead.useThemeStore.getState().hydrated, true);
    assert.equal(failedRead.useThemeStore.getState().preference, 'system');
    assert(failedRead.useThemeStore.getState().persistenceError);
    checks++;
    console.log(
      `${checks} theme preference behavior checks passed (mocked AsyncStorage + Appearance; no native rendering claim)`,
    );
  },
);
