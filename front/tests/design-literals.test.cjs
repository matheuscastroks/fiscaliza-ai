// Guarda de design: valores visuais literais só podem diminuir (ratchet).
// Cores hex, fontSize e fontWeight 800/900 devem vir de front/theme/.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const roots = ['app', 'features', 'components'];
const baselineFile = path.join(__dirname, 'design-literals-baseline.json');

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return files(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

function measure() {
  const counts = { hexColors: 0, fontSizeLiterals: 0, heavyWeights: 0 };
  for (const file of roots.flatMap(files)) {
    const text = fs.readFileSync(file, 'utf8');
    counts.hexColors += (text.match(/['"`]#[0-9a-fA-F]{3,8}['"`]/g) || []).length;
    counts.fontSizeLiterals += (text.match(/fontSize:\s*\d/g) || []).length;
    counts.heavyWeights += (text.match(/fontWeight:\s*['"](?:800|900)['"]/g) || []).length;
  }
  return counts;
}

test('literal colors, font sizes and heavy weights never increase outside theme/', () => {
  const current = measure();
  if (process.env.UPDATE_DESIGN_BASELINE) {
    fs.writeFileSync(baselineFile, JSON.stringify(current, null, 2) + '\n');
    return;
  }
  const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  for (const key of Object.keys(baseline)) {
    assert.ok(
      current[key] <= baseline[key],
      `${key}: ${current[key]} > ${baseline[key]}. Use tokens de front/theme/ em vez de valores literais.`,
    );
  }
});
