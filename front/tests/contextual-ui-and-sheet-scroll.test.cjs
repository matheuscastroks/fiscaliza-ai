const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('territory filter bar: bottom sheet enables smooth scrolling without nestedScroll deadlock', () => {
  const filterBarPath = path.join(ROOT_DIR, 'components', 'territory', 'TerritoryFilterBar.tsx');
  assert.ok(fs.existsSync(filterBarPath), 'TerritoryFilterBar.tsx must exist');

  const content = fs.readFileSync(filterBarPath, 'utf8');
  assert.ok(
    !content.includes('nestedScrollEnabled={true}'),
    'Must NOT set nestedScrollEnabled on BottomSheetScrollView to avoid Android gesture deadlocks',
  );
  assert.ok(
    content.includes('modalFooter'),
    'Must render modalFooter for filter actions',
  );
  // Ensure modalFooter is placed after BottomSheetScrollView closes
  const scrollCloseIndex = content.indexOf('</BottomSheetScrollView>');
  const footerIndex = content.indexOf('<View style={[styles.modalFooter');
  assert.ok(
    scrollCloseIndex !== -1 && footerIndex !== -1 && scrollCloseIndex < footerIndex,
    'modalFooter must be anchored outside BottomSheetScrollView as a sticky footer',
  );
});

test('app bottom sheet modal: does not constrain outer container with rigid paddingBottom', () => {
  const sheetModalPath = path.join(ROOT_DIR, 'components', 'ui', 'AppBottomSheetModal.tsx');
  assert.ok(fs.existsSync(sheetModalPath), 'AppBottomSheetModal.tsx must exist');

  const content = fs.readFileSync(sheetModalPath, 'utf8');
  assert.ok(
    !content.includes('{ paddingBottom: Math.max(insets.bottom, spacing.md) }'),
    'Must not force rigid paddingBottom on the outer container wrapping scrollable children',
  );
});

test('territory screen: implements contextual UI for search-in-this-area and right-side map dock', () => {
  const screenPath = path.join(ROOT_DIR, 'app', '(tabs)', 'TerritoryScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'TerritoryScreen.tsx must exist');

  const content = fs.readFileSync(screenPath, 'utf8');
  assert.ok(
    content.includes('hasMovedCamera'),
    'Must track whether user moved camera away from default query area',
  );
  assert.ok(
    content.includes('(hasMovedCamera || areaOnly)'),
    'Must conditionally reveal Buscar nesta área only when camera moved or area filter is active',
  );
  assert.ok(
    content.includes('rightMapDock'),
    'Must dock map positioning and framing buttons into a clean vertical right dock',
  );
  assert.ok(
    content.includes('contextualAreaPillContainer'),
    'Must place contextual area search pill at the top-center',
  );
});
