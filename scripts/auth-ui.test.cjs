const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('auth ui: backdrop photo asset exists and has valid size', () => {
  const backdropPath = path.join(ROOT_DIR, 'assets', 'images', 'auth-backdrop.jpg');
  assert.ok(fs.existsSync(backdropPath), 'auth-backdrop.jpg must exist');
  const stat = fs.statSync(backdropPath);
  assert.ok(stat.size > 10000, 'auth-backdrop.jpg should be a valid photographic asset (>10KB)');
});

test('auth ui: GovBrButton component adheres to official DS Gov.br standards', () => {
  const govButtonPath = path.join(ROOT_DIR, 'components', 'ui', 'GovBrButton.tsx');
  assert.ok(fs.existsSync(govButtonPath), 'GovBrButton.tsx must exist');

  const content = fs.readFileSync(govButtonPath, 'utf8');
  assert.ok(content.includes('export const GovBrButton'), 'Must export GovBrButton component');
  assert.ok(content.includes('#1351B4'), 'Must use official Gov.br primary blue (#1351B4)');
  assert.ok(content.includes('Entrar com'), 'Must include "Entrar com" text');
  assert.ok(content.includes('gov.br'), 'Must include "gov.br" brand text');
  assert.ok(content.includes('layout.radius.pill'), 'Must use pill radius for DS Gov.br standard');
});

test('auth ui: LoginScreen integrates civic hero backdrop and GovBrButton', () => {
  const loginScreenPath = path.join(ROOT_DIR, 'app', 'LoginScreen.tsx');
  assert.ok(fs.existsSync(loginScreenPath), 'LoginScreen.tsx must exist');

  const content = fs.readFileSync(loginScreenPath, 'utf8');
  assert.ok(content.includes('GovBrButton'), 'LoginScreen must render GovBrButton');
  assert.ok(content.includes('auth-backdrop.jpg'), 'LoginScreen must reference auth-backdrop.jpg');
  assert.ok(content.includes('KeyboardAwareScrollView'), 'LoginScreen must use KeyboardAwareScrollView');
  assert.ok(content.includes('AppBrandGlyph'), 'LoginScreen must include brand glyph');
  assert.ok(content.includes('submit'), 'LoginScreen must maintain email/password submit function');
});
