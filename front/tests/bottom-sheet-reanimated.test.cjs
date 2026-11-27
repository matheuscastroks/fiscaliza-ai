const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { loadPartialConfig, transformSync } = require('@babel/core');

const project = path.join(__dirname, '..');
const bottomSheetFixture = require.resolve('@gorhom/bottom-sheet');
const source = `
  import { useDerivedValue, useAnimatedReaction } from 'react-native-reanimated';
  useDerivedValue(() => 1, [true]);
  useAnimatedReaction(() => 1, () => {}, [true]);
`;

function compile(platform, filename = bottomSheetFixture) {
  const { options } = loadPartialConfig({
    cwd: project,
    filename,
    caller: { name: 'metro', bundler: 'metro', platform },
  });
  return transformSync(source, { ...options, presets: [] }).code;
}

test('Bottom Sheet passes undefined for Reanimated dependency arguments on native', () => {
  for (const platform of ['android', 'ios']) {
    const code = compile(platform);
    assert.equal((code.match(/,\s*void 0\)/g) || []).length, 2);
    assert.doesNotMatch(code, /\[true\]/);
  }
});

test('the native compatibility transform leaves Web and app code unchanged', () => {
  for (const code of [compile('web'), compile('android', __filename)]) {
    assert.equal((code.match(/\[true\]/g) || []).length, 2);
  }
});
