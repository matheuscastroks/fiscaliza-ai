const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(
  fs.readFileSync('stores/onboardingStore.ts', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  },
).outputText;
function setup({ value = null, read, write } = {}) {
  let stored = value,
    reads = 0;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require: (name) =>
      name === '@react-native-async-storage/async-storage'
        ? {
            getItem: async () => {
              reads++;
              return read ? read() : stored;
            },
            setItem: async (key, value) => {
              if (write) await write(key, value);
              stored = value;
            },
          }
        : require(name),
  });
  return { ...module.exports, reads: () => reads, saved: () => stored };
}
test('first launch hydrates and requests the introduction', async () => {
  const s = setup();
  await s.useOnboardingStore.getState().initialize();
  assert.equal(s.useOnboardingStore.getState().hydrated, true);
  assert.equal(s.useOnboardingStore.getState().completed, false);
});
test('completion persists across process reloads independently of the session', async () => {
  const s = setup();
  await s.useOnboardingStore.getState().initialize();
  assert.equal(await s.useOnboardingStore.getState().complete(), true);
  assert.equal(s.saved(), 'done');
  const next = setup({ value: s.saved() });
  await next.useOnboardingStore.getState().initialize();
  assert.equal(next.useOnboardingStore.getState().completed, true);
});
test('concurrent initialization only reads storage once', async () => {
  const s = setup({ value: 'done' });
  await Promise.all([
    s.useOnboardingStore.getState().initialize(),
    s.useOnboardingStore.getState().initialize(),
  ]);
  assert.equal(s.reads(), 1);
  assert.equal(s.useOnboardingStore.getState().completed, true);
});
test('late hydration cannot reopen a completed introduction', async () => {
  let resolve;
  const s = setup({
    read: () =>
      new Promise((r) => {
        resolve = r;
      }),
  });
  const hydration = s.useOnboardingStore.getState().initialize();
  await s.useOnboardingStore.getState().complete();
  resolve(null);
  await hydration;
  assert.equal(s.useOnboardingStore.getState().completed, true);
});
test('storage read failure still opens the introduction without blocking startup', async () => {
  const s = setup({
    read: () => {
      throw Error('unavailable');
    },
  });
  await s.useOnboardingStore.getState().initialize();
  assert.equal(s.useOnboardingStore.getState().hydrated, true);
  assert.equal(s.useOnboardingStore.getState().completed, false);
});
test('storage write failure lets the citizen continue in the current session', async () => {
  const s = setup({
    write: () => {
      throw Error('denied');
    },
  });
  await s.useOnboardingStore.getState().initialize();
  assert.equal(await s.useOnboardingStore.getState().complete(), false);
  assert.equal(s.useOnboardingStore.getState().completed, true);
});
