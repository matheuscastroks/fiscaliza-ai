const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('macro-themes: definition and semantic category matching', () => {
  const themesPath = path.join(ROOT_DIR, 'features', 'city', 'officialCategoryThemes.ts');
  assert.ok(fs.existsSync(themesPath), 'officialCategoryThemes.ts must exist');

  const content = fs.readFileSync(themesPath, 'utf8');
  assert.ok(content.includes('CIVIC_MACRO_THEMES'), 'Must export CIVIC_MACRO_THEMES');
  assert.ok(content.includes('matchesMacroTheme'), 'Must export matchesMacroTheme helper');
  assert.ok(content.includes('Vias e Asfalto'), 'Must include Vias e Asfalto theme');
  assert.ok(content.includes('Iluminação'), 'Must include Iluminação theme');
  assert.ok(content.includes('Limpeza e Lixo'), 'Must include Limpeza e Lixo theme');
  assert.ok(content.includes('Drenagem e Esgoto'), 'Must include Drenagem e Esgoto theme');
  assert.ok(content.includes('Trânsito e Sinais'), 'Must include Trânsito e Sinais theme');
});

test('macro-themes: filter modal renders quick civic chips and filters subservices', () => {
  const filterBarPath = path.join(ROOT_DIR, 'components', 'territory', 'TerritoryFilterBar.tsx');
  const content = fs.readFileSync(filterBarPath, 'utf8');

  assert.ok(content.includes('CIVIC_MACRO_THEMES'), 'Filter modal must use CIVIC_MACRO_THEMES');
  assert.ok(content.includes('macroThemesTrack'), 'Filter modal must render horizontal macro themes track');
  assert.ok(content.includes('filteredServiceOptions'), 'Must dynamically filter specific subservices by selected macro theme');
});
