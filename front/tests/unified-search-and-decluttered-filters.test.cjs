const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('unified search: PlaceSelector supports custom renderTrigger for inline capsules', () => {
  const placeSelectorPath = path.join(ROOT_DIR, 'features', 'places', 'PlaceSelector.tsx');
  assert.ok(fs.existsSync(placeSelectorPath), 'PlaceSelector.tsx must exist');

  const content = fs.readFileSync(placeSelectorPath, 'utf8');
  assert.ok(
    content.includes('renderTrigger'),
    'PlaceSelector must accept renderTrigger prop',
  );
  assert.ok(
    content.includes('shortSummary'),
    'PlaceSelector must compute shortSummary for compact inline pills',
  );
});

test('unified search: CitySearch accepts leftElement for inline location integration', () => {
  const citySearchPath = path.join(ROOT_DIR, 'components', 'ui', 'CitySearch.tsx');
  assert.ok(fs.existsSync(citySearchPath), 'CitySearch.tsx must exist');

  const content = fs.readFileSync(citySearchPath, 'utf8');
  assert.ok(
    content.includes('leftElement?: React.ReactNode;'),
    'CitySearchProps must accept leftElement prop',
  );
  assert.ok(
    content.includes('{leftElement}'),
    'CitySearch must render leftElement inside the search container',
  );
});

test('territory filter bar: integrates unified search island and 1-tap quick filter carousel', () => {
  const filterBarPath = path.join(ROOT_DIR, 'components', 'territory', 'TerritoryFilterBar.tsx');
  assert.ok(fs.existsSync(filterBarPath), 'TerritoryFilterBar.tsx must exist');

  const content = (fs.readFileSync(filterBarPath, 'utf8') + fs.readFileSync(filterBarPath.replace('TerritoryFilterBar', 'TerritoryFilterModal'), 'utf8') + fs.readFileSync(filterBarPath.replace('TerritoryFilterBar', 'TerritoryFilterModal.styles').replace('.tsx', '.ts'), 'utf8'));

  // Unified bar
  assert.ok(
    content.includes('leftElement={locationTrigger}'),
    'Must pass locationTrigger into CitySearch to form unified capsule',
  );
  assert.ok(
    content.includes('unifiedLocationPill'),
    'Must style inline location pill within the unified capsule',
  );

  // Quick filter carousel
  assert.ok(
    content.includes('quickChipsTrack'),
    'Must provide horizontal quickChipsTrack for 1-tap toggling',
  );
  assert.ok(
    content.includes('domainPillTrack'),
    'Must provide instant 1-tap domain toggle between 1746 and facilities',
  );
  assert.ok(
    content.includes('quickChip'),
    'Must provide quickChip buttons for inline filter toggles',
  );
});

test('decluttered filter modal: removes duplicate geographical selectors and adopts frameless civic sections', () => {
  const filterBarPath = path.join(ROOT_DIR, 'components', 'territory', 'TerritoryFilterBar.tsx');
  const content = (fs.readFileSync(filterBarPath, 'utf8') + fs.readFileSync(filterBarPath.replace('TerritoryFilterBar', 'TerritoryFilterModal'), 'utf8') + fs.readFileSync(filterBarPath.replace('TerritoryFilterBar', 'TerritoryFilterModal.styles').replace('.tsx', '.ts'), 'utf8'));

  // Declutter: removed redundant scope banner from modal body
  assert.ok(
    !content.includes('Recorte territorial em exibição'),
    'Filter modal must NOT render redundant scope banner inside sheet body',
  );
  assert.ok(
    content.includes('filterFormContainer'),
    'Filter modal must use frameless filterFormContainer instead of nested cards',
  );
  assert.ok(
    content.includes('macroThemesTrack'),
    'Filter modal must preserve macroThemesTrack',
  );
  assert.ok(
    content.includes("flexWrap: 'wrap'"),
    'macroThemesTrack must use wrap layout to avoid horizontal scroll deadlock in bottom sheet',
  );

  // No duplicate pickers in modal
  assert.ok(
    !content.includes('<NeighborhoodPicker'),
    'Must NOT embed duplicate NeighborhoodPicker inside TerritoryFilterModal',
  );
  assert.ok(
    !content.includes('Abrangência territorial'),
    'Must NOT duplicate Todo o Rio vs Área no mapa inside filter modal',
  );

  // Preserves civic and facility filtering
  assert.ok(
    content.includes('CIVIC_MACRO_THEMES'),
    'Filter modal must preserve civic macro themes',
  );
  assert.ok(
    content.includes('filteredServiceOptions'),
    'Filter modal must filter specific subservices dynamically',
  );
  assert.ok(
    content.includes('facilityCardsContainer'),
    'Filter modal must preserve public facility category toggles',
  );
  assert.ok(
    content.includes('modalFooter'),
    'Must preserve sticky modal footer with reset and apply actions',
  );
});

test('place selector bottom sheet: adopts Apple Inset-Grouped table design and smooth scroll', () => {
  const placeSelectorPath = path.join(ROOT_DIR, 'features', 'places', 'PlaceSelector.tsx');
  const content = ['PlaceSelector.tsx', 'PlaceSelectorSheet.tsx', 'PlaceSelector.styles.ts']
    .map((name) => fs.readFileSync(path.join(path.dirname(placeSelectorPath), name), 'utf8'))
    .join(String.fromCharCode(10));

  assert.ok(
    content.includes('BottomSheetScrollView'),
    'PlaceSelector bottom sheet must use BottomSheetScrollView for smooth scrolling',
  );
  assert.ok(
    content.includes('heroScopeCard'),
    'Must render heroScopeCard showing active scope and undo area trigger',
  );
  assert.ok(
    content.includes('insetGroupCard'),
    'Must group actions in Apple-style insetGroupCard containers',
  );
  assert.ok(
    content.includes('insetRow'),
    'Must format items as interactive insetRow elements with icons and descriptions',
  );
  assert.ok(
    content.includes('filterFormContainer'),
    'PlaceSelector must use filterFormContainer matching TerritoryFilterBar architecture',
  );
  assert.ok(
    content.includes('sectionHeaderRow'),
    'PlaceSelector must use sectionHeaderRow with icon and uppercase label',
  );
  assert.ok(
    content.includes('sectionDivider'),
    'PlaceSelector must use sectionDivider between logical sections',
  );
});

test('territory screen: respects architecture constraints and line ceiling', () => {
  const screenPath = path.join(ROOT_DIR, 'app', '(tabs)', 'TerritoryScreen.tsx');
  const content = fs.readFileSync(screenPath, 'utf8');

  const lines = content.split('\n').length;
  assert.ok(
    lines < 600,
    `TerritoryScreen should stay below 600 lines, currently at ${lines}`,
  );

  assert.ok(
    content.includes('top: insets.top + 108'),
    'Contextual search pill must be placed right below top search bar (top: insets.top + 108)',
  );
});
