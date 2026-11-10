const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('auth ui: backdrop photo asset exists and has valid size', () => {
  const backdropPath = path.join(
    ROOT_DIR,
    'assets',
    'images',
    'auth-backdrop.jpg',
  );
  assert.ok(fs.existsSync(backdropPath), 'auth-backdrop.jpg must exist');
  const stat = fs.statSync(backdropPath);
  assert.ok(
    stat.size > 10000,
    'auth-backdrop.jpg should be a valid photographic asset (>10KB)',
  );
});

test('auth ui: GovBrButton component adheres to official DS Gov.br standards', () => {
  const govButtonPath = path.join(
    ROOT_DIR,
    'components',
    'ui',
    'GovBrButton.tsx',
  );
  assert.ok(fs.existsSync(govButtonPath), 'GovBrButton.tsx must exist');

  const content = fs.readFileSync(govButtonPath, 'utf8');
  assert.ok(
    content.includes('export const GovBrButton'),
    'Must export GovBrButton component',
  );
  assert.ok(
    content.includes('#1351B4'),
    'Must use official Gov.br primary blue (#1351B4)',
  );
  assert.ok(content.includes('Entrar com'), 'Must include "Entrar com" text');
  assert.ok(content.includes('gov.br'), 'Must include "gov.br" brand text');
  assert.ok(
    content.includes('layout.radius.pill'),
    'Must use pill radius for DS Gov.br standard',
  );
});

test('auth ui: LoginScreen integrates civic hero backdrop and offers only options that work', () => {
  const loginScreenPath = path.join(ROOT_DIR, 'app', 'LoginScreen.tsx');
  assert.ok(fs.existsSync(loginScreenPath), 'LoginScreen.tsx must exist');

  const content = fs.readFileSync(loginScreenPath, 'utf8');
  assert.ok(
    !content.includes('GovBrButton'),
    'LoginScreen must not show the gov.br button while it is unavailable',
  );
  const layout = fs.readFileSync(
    path.join(ROOT_DIR, 'components', 'ui', 'AuthScreenLayout.tsx'),
    'utf8',
  );
  const register = fs.readFileSync(
    path.join(ROOT_DIR, 'app', 'RegisterScreen.tsx'),
    'utf8',
  );
  assert.ok(
    content.includes('AuthScreenLayout') &&
      register.includes('AuthScreenLayout'),
    'Both forms must share the entry layout',
  );
  assert.ok(
    layout.includes('auth-backdrop.jpg'),
    'Shared layout must reference auth-backdrop.jpg',
  );
  assert.ok(
    layout.includes('KeyboardAwareScrollView'),
    'Shared layout must use KeyboardAwareScrollView',
  );
  assert.ok(
    layout.includes('AppBrandGlyph'),
    'Shared layout must include brand glyph',
  );
  assert.ok(
    content.includes('submit'),
    'LoginScreen must maintain email/password submit function',
  );
});

test('brand identity: two-color SVG/PNG assets, AppBrandGlyph variants, and Fiscaliza aí spelling', () => {
  const brandFiles = [
    'brand-glyph.svg',
    'brand-glyph-dark.svg',
    'brand-glyph-negative.svg',
    'brand-pin.svg',
    'brand-pin-dark.svg',
    'brand-pin-on-dark.svg',
    'brand-sparkle.svg',
    'brand-horizontal.svg',
    'brand-horizontal-dark.svg',
  ];
  for (const file of brandFiles) {
    const p = path.join(ROOT_DIR, 'assets', 'brand', file);
    assert.ok(fs.existsSync(p), `Brand asset ${file} must exist`);
  }

  const glyphSvg = fs.readFileSync(
    path.join(ROOT_DIR, 'assets', 'brand', 'brand-glyph.svg'),
    'utf8',
  );
  assert.ok(glyphSvg.includes('#16576C'), 'Light glyph must contain primary #16576C');
  assert.ok(glyphSvg.includes('#F4B400'), 'Light glyph must contain brandYellow #F4B400');

  const darkGlyphSvg = fs.readFileSync(
    path.join(ROOT_DIR, 'assets', 'brand', 'brand-glyph-dark.svg'),
    'utf8',
  );
  assert.ok(darkGlyphSvg.includes('#79CBD5'), 'Dark glyph must contain darkPrimary #79CBD5');
  assert.ok(darkGlyphSvg.includes('#F4B400'), 'Dark glyph must contain brandYellow #F4B400');

  const glyphComp = fs.readFileSync(
    path.join(ROOT_DIR, 'components', 'ui', 'AppBrandGlyph.tsx'),
    'utf8',
  );
  assert.ok(
    !glyphComp.includes('tintColor='),
    'AppBrandGlyph must not override two-color brand SVGs with tintColor',
  );
  assert.ok(
    glyphComp.includes('export function AppBrandLockup'),
    'AppBrandGlyph module must export horizontal AppBrandLockup',
  );
  assert.ok(
    glyphComp.includes('pinTranslateY') && glyphComp.includes('withDelay'),
    'AppBrandGlyph must animate pin landing and delayed sparkle rays',
  );

  const animatedSplash = fs.readFileSync(
    path.join(ROOT_DIR, 'components', 'ui', 'AnimatedBrandSplash.tsx'),
    'utf8',
  );
  assert.ok(
    animatedSplash.includes('export function AnimatedBrandSplash') &&
      animatedSplash.includes('AppBrandGlyph'),
    'AnimatedBrandSplash must render AppBrandGlyph on startup',
  );

  const rootLayout = fs.readFileSync(
    path.join(ROOT_DIR, 'app', '_layout.tsx'),
    'utf8',
  );
  assert.ok(
    rootLayout.includes('<AnimatedBrandSplash />'),
    'RootLayout must mount AnimatedBrandSplash on startup',
  );

  const appJson = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, 'app.json'), 'utf8'),
  );
  assert.equal(appJson.expo.name, 'Fiscaliza aí');
  assert.equal(appJson.expo.slug, 'fiscaliza-ai');

  const colorsContent = fs.readFileSync(
    path.join(ROOT_DIR, 'theme', 'colors.ts'),
    'utf8',
  );
  assert.ok(
    colorsContent.includes("brandYellow: '#F4B400'"),
    'colors.ts must define brandYellow #F4B400',
  );
});
