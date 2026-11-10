const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('profile screen: lean identity, metrics, domicile and a short menu; account actions live in AccountScreen', () => {
  const profile = fs.readFileSync(path.join(ROOT_DIR, 'app', '(tabs)', 'ProfileScreen.tsx'), 'utf8');
  const styles = fs.readFileSync(path.join(ROOT_DIR, 'features', 'profile', 'profileScreenStyles.ts'), 'utf8');
  const account = fs.readFileSync(path.join(ROOT_DIR, 'app', 'AccountScreen.tsx'), 'utf8');
  const content = profile + styles;

  assert.ok(content.includes('UserAvatar') && content.includes('useAuthStore'), 'identity bound to the session');
  assert.ok(content.includes('useFollowStore') && content.includes('usePlacesStore'), 'metrics bound to saved calls and places');
  assert.ok(content.includes('metricCard') && content.includes('savedCalls.length') && content.includes('places.length'), 'two civic metrics');
  assert.ok(content.includes('Domicílio') && content.includes('Cadastrar meu CEP') && content.includes('<PostalCodeSheet'), 'single CEP registration in a sheet');
  assert.ok(content.includes("'/PlacesScreen'") && !content.includes('PlacesSheet'), 'places have a single screen');
  assert.ok(!content.includes('Município e Bairro'), 'no redundant municipality selector');

  // Menu curto com componentes compartilhados
  assert.ok(profile.includes('InsetGroup') && profile.includes('ListRow'), 'menu uses shared InsetGroup/ListRow');
  for (const path_ of ['/SettingsScreen', '/ResultsScreen', '/HelpScreen', '/AboutScreen', '/AccountScreen']) {
    assert.ok(profile.includes(path_), `menu links to ${path_}`);
  }
  assert.ok(!profile.includes('OfficialCallRow'), 'saved calls live in the Salvos tab, not in the profile');
  assert.ok(!profile.includes('deleteAccount'), 'destructive account actions are not on the profile');

  // Conta e privacidade
  assert.ok(account.includes('deleteAccount') && account.includes('useSignOutSheet'), 'AccountScreen owns sign out and deletion');
  assert.ok(account.includes('AppBottomSheetModal'), 'deletion is confirmed in a bottom sheet');
  assert.ok(!(profile + account).includes('/activity'), 'no legacy /activity route');
});

test('postal code: sheet and municipality screen share one flow and service', () => {
  const sheet = fs.readFileSync(path.join(ROOT_DIR, 'components', 'profile', 'PostalCodeSheet.tsx'), 'utf8');
  const screen = fs.readFileSync(path.join(ROOT_DIR, 'app', 'MunicipalityScreen.tsx'), 'utf8');
  const service = fs.readFileSync(path.join(ROOT_DIR, 'services', 'postalCode.ts'), 'utf8');
  assert.ok(sheet.includes('AppBottomSheetModal') && sheet.includes('BottomSheetTextInput'), 'Sheet keeps native keyboard handling');
  for (const content of [sheet, screen]) {
    assert.ok(content.includes('usePostalCodeFlow'), 'Both screens use the shared flow');
    assert.ok(!content.includes('/profile/postal-code/'), 'No duplicated endpoint calls in UI');
  }
  assert.ok(service.includes('/profile/postal-code/') && service.includes('/profile/municipality'), 'Service owns the endpoints');
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'features', 'profile', 'usePostalCodeFlow.ts')));
  assert.ok(!fs.existsSync(path.join(ROOT_DIR, 'components', 'profile', 'PlacesSheet.tsx')), 'PlacesSheet removed');
});
