const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('follow screen: includes dynamic count badges in tab filters', () => {
  const followPath = path.join(ROOT_DIR, 'app', '(tabs)', 'FollowScreen.tsx');
  assert.ok(fs.existsSync(followPath), 'FollowScreen.tsx must exist');

  const content = fs.readFileSync(followPath, 'utf8');
  assert.ok(content.includes('Todos (${savedCalls.length})'), 'Must show total saved count in tab');
  assert.ok(content.includes('Em aberto (${openCount})'), 'Must show open count in tab');
  assert.ok(content.includes('Encerrados (${closedCount})'), 'Must show closed count in tab');
  assert.ok(!content.includes('na tela inicial'), 'Must not reference outdated initial screen');
});

test('facility details: provides quick actions for GPS route and phone calls', () => {
  const facilityPath = path.join(ROOT_DIR, 'components', 'territory', 'FacilityDetails.tsx');
  assert.ok(fs.existsSync(facilityPath), 'FacilityDetails.tsx must exist');

  const content = fs.readFileSync(facilityPath, 'utf8');
  assert.ok(content.includes('handleOpenDirections'), 'Must implement GPS route handler');
  assert.ok(content.includes('handleCall'), 'Must implement phone call handler');
  assert.ok(content.includes('Como chegar'), 'Must render GPS navigation CTA');
  assert.ok(content.includes('Ligar para a unidade'), 'Must render direct phone CTA when available');
});

test('places screen: renders structured cards with icons, radius badges and map action', () => {
  const placesPath = path.join(ROOT_DIR, 'app', 'PlacesScreen.tsx');
  assert.ok(fs.existsSync(placesPath), 'PlacesScreen.tsx must exist');

  const content = fs.readFileSync(placesPath, 'utf8');
  assert.ok(content.includes('getPlaceIcon'), 'Must map place category icons');
  assert.ok(content.includes('formatRadius'), 'Must format radius in meters or km');
  assert.ok(content.includes('Ver chamados perto daqui'), 'Must provide direct map query CTA');
  assert.ok(content.includes('styles.placeCard'), 'Must wrap places in structured card containers');
});

test('official call details: provides quick protocol share/copy pill', () => {
  const detailsPath = path.join(ROOT_DIR, 'app', 'OfficialCallDetailsScreen.tsx');
  assert.ok(fs.existsSync(detailsPath), 'OfficialCallDetailsScreen.tsx must exist');

  const content = fs.readFileSync(detailsPath, 'utf8');
  assert.ok(content.includes('protocolPill'), 'Must define protocol pill styling');
  assert.ok(content.includes('copy-outline'), 'Must render copy/share icon next to protocol');
});

test('vocabulary alignment: removes legacy Home references from help and settings', () => {
  const settingsPath = path.join(ROOT_DIR, 'app', 'SettingsScreen.tsx');
  const helpPath = path.join(ROOT_DIR, 'app', 'HelpScreen.tsx');

  const settingsContent = fs.readFileSync(settingsPath, 'utf8');
  const helpContent = fs.readFileSync(helpPath, 'utf8');

  assert.ok(!settingsContent.includes('na Home'), 'SettingsScreen must not refer to Home');
  assert.ok(!helpContent.includes('na Home'), 'HelpScreen must not refer to Home');
  assert.ok(settingsContent.includes('o mapa já abrir nele'), 'SettingsScreen must refer to map focus');
});
