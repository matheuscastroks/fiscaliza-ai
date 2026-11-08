const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('settings screen: removes redundancies (places and saved calls) and adopts Apple Inset-Grouped tables', () => {
  const settingsPath = path.join(ROOT_DIR, 'app', 'SettingsScreen.tsx');
  assert.ok(fs.existsSync(settingsPath), 'SettingsScreen.tsx must exist');

  const content = fs.readFileSync(settingsPath, 'utf8');

  // Elimination of redundant sections
  assert.ok(!content.includes("'/PlacesScreen'"), 'Must remove redundant PlacesScreen link from settings');
  assert.ok(!content.includes('clearSavedCalls'), 'Must remove redundant saved calls clearing logic from settings');
  assert.ok(!content.includes('Chamados salvos neste aparelho'), 'Must remove redundant saved calls section');

  // Apple Inset-Grouped containers and frameless form sections
  assert.ok(content.includes('sectionBlock'), 'Must use frameless section blocks');
  assert.ok(content.includes('sectionHeaderRow'), 'Must style headers with sectionHeaderRow');
  assert.ok(content.includes('insetTable'), 'Must adopt Apple Inset Tables');
  assert.ok(content.includes('tableRow'), 'Must use structured table rows');
  assert.ok(content.includes('iconSquircle'), 'Must style section icons with squircles');

  // Essential features preserved
  assert.ok(content.includes('SlidingTabs'), 'Must preserve theme appearance switcher');
  assert.ok(content.includes('NeighborhoodPicker'), 'Must preserve neighborhood reference picker');
  assert.ok(content.includes('focar o mapa automaticamente'), 'Must retain map focus instructions');
  assert.ok(content.includes('useNotificationStore'), 'Must retain notification store binding');
  assert.ok(content.includes('Testar notificação no aparelho'), 'Must retain push test action');
});
