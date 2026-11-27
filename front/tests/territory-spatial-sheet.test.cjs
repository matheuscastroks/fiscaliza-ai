const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('territory results: uses a virtualized full-screen list with map entry navigation', () => {
  const listViewPath = path.join(ROOT_DIR, 'components', 'territory', 'TerritoryListView.tsx');
  assert.ok(fs.existsSync(listViewPath), 'TerritoryListView.tsx must exist');

  const content = fs.readFileSync(listViewPath, 'utf8');
  assert.ok(content.includes('<FlatList<Entry>'), 'Must virtualize the results');
  assert.ok(!content.includes('BottomSheetFlatList'), 'Results must sit outside the map sheet');
  assert.ok(content.includes('onLocateEntry'), 'Must support locating entries directly onto the map');
});

test('territory screen: bridges list item to map camera and preview card with haptics', () => {
  const screenPath = path.join(ROOT_DIR, 'app', '(tabs)', 'TerritoryScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'TerritoryScreen.tsx must exist');

  const content = fs.readFileSync(screenPath, 'utf8') + ['useTerritoryController', 'useTerritoryQueries', 'useTerritoryView'].map((n) => fs.readFileSync(path.join(ROOT_DIR, 'features', 'territory', n + '.ts'), 'utf8')).join(String.fromCharCode(10));
  assert.ok(content.includes('handleLocateEntry'), 'Must implement handleLocateEntry');
  assert.ok(content.includes('Haptics.impactAsync'), 'Must trigger tactile feedback on locate');
  assert.ok(content.includes('zoom: 16.5'), 'Must focus camera closely on located coordinate');
  assert.ok(content.includes('setSelectedId(entry.item.id)'), 'Must select entry to immediately display preview card');
});
