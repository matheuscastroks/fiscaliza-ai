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


function loadSharedThemes() {
  const ts = require('typescript');
  const vm = require('node:vm');
  const module = { exports: {} };
  const file = path.resolve(ROOT_DIR, '..', 'shared', 'service-themes.ts');
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    Error,
  });
  return module.exports;
}

test('macro-themes: shared classifier matches the server filter', () => {
  const {
    MACRO_THEME_IDS,
    isMacroThemeId,
    resolveServiceThemeId,
    serviceTypesForTheme,
  } = loadSharedThemes();

  assert.deepEqual(Array.from(MACRO_THEME_IDS), [
    'road',
    'lighting',
    'cleaning',
    'nature',
    'drainage',
    'traffic',
  ]);
  assert.equal(isMacroThemeId('lighting'), true);
  assert.equal(isMacroThemeId('all'), false);
  assert.equal(isMacroThemeId(undefined), false);

  assert.equal(resolveServiceThemeId('Iluminação Pública', null), 'lighting');
  assert.equal(resolveServiceThemeId('Tapa-buraco', null), 'road');
  assert.equal(resolveServiceThemeId('Coleta de lixo', null), 'cleaning');
  assert.equal(resolveServiceThemeId('Poda de árvore', null), 'nature');
  assert.equal(resolveServiceThemeId('Desobstrução de bueiro', null), 'drainage');
  assert.equal(resolveServiceThemeId('Semáforo apagado', null), 'traffic');
  assert.equal(resolveServiceThemeId('Serviço genérico', null), 'general');
  assert.equal(resolveServiceThemeId('Serviço genérico', 'poste apagado'), 'lighting');

  assert.deepEqual(
    Array.from(
      serviceTypesForTheme(
        ['Iluminação Pública', 'Tapa-buraco', 'Coleta de lixo', 'Semáforo'],
        'lighting',
      ),
    ),
    ['Iluminação Pública'],
  );
});
