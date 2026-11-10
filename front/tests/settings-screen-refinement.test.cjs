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
  assert.ok(content.includes('clearSavedCalls') && content.includes('Alert.alert'), 'PRODUCT.md exige apagar salvos com confirmação');
  assert.ok(!content.includes('Chamados salvos neste aparelho'), 'Must remove redundant saved calls section');

  // Apple Inset-Grouped containers and frameless form sections
  assert.ok(content.includes('sectionBlock'), 'Must use frameless section blocks');
  assert.ok(content.includes('sectionHeaderRow'), 'Must style headers with sectionHeaderRow');
  assert.ok(content.includes('InsetGroup') && content.includes('ListRow'), 'Must use the shared InsetGroup/ListRow');

  // Essential features preserved
  assert.ok(content.includes('SlidingTabs'), 'Must preserve theme appearance switcher');
  assert.ok(content.includes('NeighborhoodPicker'), 'Must preserve neighborhood reference picker');
  assert.ok(content.includes('o mapa já abrir nele'), 'Must retain map focus instructions');
  assert.ok(content.includes('useNotificationStore'), 'Must retain notification store binding');
  assert.ok(!content.includes('Testar notificação no celular'), 'O envio de teste de push foi removido');
});
