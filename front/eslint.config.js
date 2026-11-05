// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/**',
      'back/**',
      'municipal/**',
      '.agents/**',
      '.validation/**',
    ],
    rules: {
      'import/no-unresolved': 'off',
    },
  },
]);
