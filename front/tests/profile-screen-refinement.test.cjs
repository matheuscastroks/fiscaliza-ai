const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('profile screen: adopts Apple Inset-Grouped tables and modern civic metrics', () => {
  const screenPath = path.join(ROOT_DIR, 'app', '(tabs)', 'ProfileScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'ProfileScreen.tsx must exist');

  const content = fs.readFileSync(screenPath, 'utf8');

  // Core stores & avatar
  assert.ok(content.includes('UserAvatar'), 'Must integrate UserAvatar');
  assert.ok(content.includes('useAuthStore'), 'Must bind user authentication state');
  assert.ok(content.includes('useFollowStore'), 'Must bind saved calls store');
  assert.ok(content.includes('usePlacesStore'), 'Must bind places store');

  // Apple Inset-Grouped Tables
  assert.ok(content.includes('insetTable'), 'Must adopt Apple Inset-Grouped table containers');
  assert.ok(content.includes('tableRow'), 'Must style rows with standard tableRow');
  assert.ok(content.includes('tableDivider'), 'Must separate rows with hairline table dividers');
  assert.ok(content.includes('iconSquircle'), 'Must style section icons with squircles');

  // Sections
  assert.ok(content.includes('DOMICÍLIO CÍVICO'), 'Must group citizen locality under Domicílio Cívico');
  assert.ok(content.includes('Cadastrar meu CEP'), 'Domicílio Cívico must feature single streamlined CEP registration for Rio citizens');
  assert.ok(!content.includes('Município e Bairro'), 'Must eliminate redundant municipality selector as app is exclusively for Rio');
  assert.ok(content.includes('CONFIGURAÇÕES'), 'Must group settings in Apple Inset Table');
  assert.ok(content.includes('INFORMAÇÕES E TRANSPARÊNCIA'), 'Must group transparency links in Apple Inset Table');
  assert.ok(content.includes('PRIVACIDADE E CONTA'), 'Must group privacy and account actions');

  // Dual Metric KPIs
  assert.ok(content.includes('metricCard'), 'Must render structured metric cards');
  assert.ok(content.includes('savedCalls.length'), 'Must display saved calls count');
  assert.ok(content.includes('places.length'), 'Must display saved places count');

  // Account actions & modal
  assert.ok(content.includes('useSignOutSheet'), 'Must preserve sign out sheet');
  assert.ok(content.includes('deleteAccount'), 'Must preserve account deletion');
  assert.ok(content.includes('AppBottomSheetModal'), 'Must preserve account deletion bottom sheet modal');

  // Legacy removal guard (ensures test legacy-removal.test.cjs continues to pass)
  assert.ok(!content.includes('/activity'), 'Must not reference legacy /activity route');
});
