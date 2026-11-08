const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('territory sheet: uses 3-tier spatial snap points (half, expanded, full)', () => {
  const listViewPath = path.join(ROOT_DIR, 'components', 'territory', 'TerritoryListView.tsx');
  assert.ok(fs.existsSync(listViewPath), 'TerritoryListView.tsx must exist');

  const content = fs.readFileSync(listViewPath, 'utf8');
  assert.ok(content.includes("snapPoints={['48%', '75%', '92%']}"), 'Must configure half, expanded and full snap points');
  assert.ok(content.includes('backdropOpacity={0.16}'), 'Must maintain subtle map backdrop visibility');
  assert.ok(content.includes('BottomSheetFlatList'), 'Must use BottomSheetFlatList for smooth gesture scrolling');
  assert.ok(content.includes('onLocateEntry'), 'Must support locating entries directly onto the map');
});

test('territory screen: bridges list item to map camera and preview card with haptics', () => {
  const screenPath = path.join(ROOT_DIR, 'app', '(tabs)', 'TerritoryScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'TerritoryScreen.tsx must exist');

  const content = fs.readFileSync(screenPath, 'utf8');
  assert.ok(content.includes('handleLocateEntry'), 'Must implement handleLocateEntry');
  assert.ok(content.includes('Haptics.impactAsync'), 'Must trigger tactile feedback on locate');
  assert.ok(content.includes('zoom: 16.5'), 'Must focus camera closely on located coordinate');
  assert.ok(content.includes('setSelectedId(entry.item.id)'), 'Must select entry to immediately display preview card');
});
