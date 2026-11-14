import js from './back/node_modules/@eslint/js/src/index.js';
import tsPlugin from './back/node_modules/@typescript-eslint/eslint-plugin/dist/index.js';
import tsParser from './back/node_modules/@typescript-eslint/parser/dist/index.js';
import globals from './back/node_modules/globals/index.js';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', 'front/**', '.claude/**'] },
  {
    files: ['back/**/*.ts', 'shared/**/*.ts'],
    languageOptions: { parser: tsParser, globals: globals.node },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs['eslint-recommended'].overrides[0].rules,
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
