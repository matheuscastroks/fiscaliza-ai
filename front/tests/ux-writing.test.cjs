// Trava de UX Writing: termos técnicos não podem voltar aos textos da interface.
// Glossário e alternativas em ../plan/39-guia-ux-writing.md.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const roots = ['app', 'features', 'components'];
const BANNED = /\b(SLA|GPS|recorte|território|territorial|territórios|equipamentos?|camadas?|domicílio|PCRJ|sincroniza\w*|município|municipais|entorno)\b/i;

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return files(full);
    return /\.tsx$/.test(entry.name) ? [full] : [];
  });
}

function visibleTexts(source) {
  const noComments = source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  const texts = [];
  // textos entre aspas e crases (rótulos, mensagens, acessibilidade)
  for (const m of noComments.matchAll(/(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) texts.push(m[2]);
  // texto corrido de JSX
  for (const m of noComments.matchAll(/>([^<>{}]*[A-Za-zÀ-ú][^<>{}]*)</g)) texts.push(m[1].replace(/\s+/g, ' '));
  return texts.filter((t) => /\s/.test(t.trim()) || /^[A-ZÀ-Ú]/.test(t.trim()));
}

test('a interface não usa jargão técnico (veja o glossário do guia de UX Writing)', () => {
  const hits = [];
  for (const rel of roots.flatMap((r) => files(path.join(ROOT, r)))) {
    for (const text of visibleTexts(fs.readFileSync(rel, 'utf8'))) {
      if (text.startsWith('@/') || text.startsWith('./') || text.startsWith('http')) continue;
      const match = BANNED.exec(text);
      if (match) hits.push(`${path.relative(ROOT, rel)}: "${text.trim().slice(0, 80)}" -> ${match[0]}`);
    }
  }
  assert.deepEqual(hits, [], 'Troque pelos termos do glossário:\n' + hits.join('\n'));
});
