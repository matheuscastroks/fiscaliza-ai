const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dates = require('@/features/city/formatDates');
const { describeOfficialPhase } = require('@/features/city/officialCallStatus');
const { computeOverviewRegion } = require('@/features/territory/selectors');
const { lightColors, darkColors } = require('@/theme/colors');

const ROOT = path.resolve(__dirname, '..');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

test('o tipo de situação do 1746 vira texto simples, sem "Tipo:"', () => {
  assert.equal(describeOfficialPhase('Andamento'), 'Fase no 1746: em andamento');
  assert.equal(describeOfficialPhase('NÃO INICIADO'), 'Fase no 1746: ainda não iniciado');
  assert.equal(describeOfficialPhase('Outra Fase'), 'Fase no 1746: outra fase');
  assert.equal(describeOfficialPhase(''), null);
  assert.equal(describeOfficialPhase(null), null);
});

test('datas do detalhe: prazo sem hora, instante com hora, ausência com travessão', () => {
  assert.equal(dates.formatCallDateTime('2026-10-01'), '01/10/2026');
  assert.match(dates.formatCallDateTime('2026-10-01T14:30:00'), /^01\/10\/2026,? 14:30$/);
  assert.equal(dates.formatCallDateTime(null), '—');
});

test('o enquadramento inicial cobre todos os pontos e não aproxima demais num ponto só', () => {
  const fallback = { latitude: 0, longitude: 0, latitudeDelta: 1, longitudeDelta: 1 };
  const points = [{ latitude: -22.9, longitude: -43.7 }, { latitude: -22.95, longitude: -43.55 }];
  const region = computeOverviewRegion(points, fallback);
  assert.deepEqual(region.bounds.southWest, [-43.7, -22.95]);
  assert.deepEqual(region.bounds.northEast, [-43.55, -22.9]);
  const single = computeOverviewRegion([points[0]], fallback).bounds;
  assert.ok(single.northEast[0] - single.southWest[0] >= 0.004 - 1e-9);
  assert.equal(computeOverviewRegion([], fallback), fallback);
});

test('texto secundário (subtle) passa AA nos dois temas', () => {
  for (const [colors, name] of [[lightColors, 'claro'], [darkColors, 'escuro']]) {
    assert.ok(contrast(colors.subtle, colors.canvas) >= 4.5, `subtle sobre canvas no ${name}`);
    assert.ok(contrast(colors.subtle, colors.surface) >= 4.5, `subtle sobre surface no ${name}`);
  }
});

test('"Buscar nesta área" depende de gesto do usuário, não de movimento da câmera', () => {
  const view = read('features', 'territory', 'useTerritoryView.ts');
  assert.match(view, /if \(newRegion\.userGesture\) setHasMovedCamera\(true\)/);
  assert.match(read('components', 'ui', 'MapboxMapView.tsx'), /isGestureActive/);
});

test('copiar protocolo usa a área de transferência, não o compartilhamento', () => {
  const screen = read('features', 'city', 'call-details', 'OfficialCallDetailsScreen.tsx');
  assert.match(screen, /copyText\(item\.externalId\)/);
  assert.match(read('utils', 'clipboard.ts'), /expo-clipboard/);
});

test('telas com abas usam o mesmo recuo da barra flutuante', () => {
  for (const file of ['FollowScreen.tsx', 'ParticipateScreen.tsx', 'ProfileScreen.tsx']) {
    assert.match(read('app', '(tabs)', file), /useTabBarInset\(\)/, file);
  }
});

test('reduzir movimento vem de um hook único', () => {
  for (const file of [['components', 'ui', 'AppTabBar.tsx'], ['components', 'ui', 'SlidingTabs.tsx'], ['components', 'ui', 'DetailSheet.tsx'], ['components', 'ui', 'AppBrandGlyph.tsx'], ['features', 'onboarding', 'OnboardingFlow.tsx']]) {
    const text = read(...file);
    assert.ok(!text.includes('isReduceMotionEnabled'), file.join('/'));
    assert.match(text, /useReducedMotion\(\)/, file.join('/'));
  }
});
