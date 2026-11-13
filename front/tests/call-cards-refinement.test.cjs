const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('call cards: lista e sheet compartilham um único CallSummary com metadados cívicos', () => {
  const read = (...parts) => fs.readFileSync(path.join(ROOT_DIR, ...parts), 'utf8');
  const summary = read('components', 'official', 'CallSummary.tsx');
  const row = read('components', 'official', 'OfficialCallRow.tsx');
  const preview = read('components', 'territory', 'TerritoryPreviewCard.tsx');

  assert.ok(summary.includes('formatRelativeAge'), 'CallSummary must format relative age (e.g. Há X dias)');
  assert.ok(summary.includes('resolveOfficialCallDeadline') && summary.includes('isOverdue'), 'CallSummary must resolve overdue deadlines');
  for (const [name, content] of [['OfficialCallRow', row], ['TerritoryPreviewCard', preview]]) {
    assert.ok(content.includes('<CallSummary'), `${name} must render the shared CallSummary`);
    assert.ok(!content.includes('slaBadge') && !content.includes('categoryBadge'), `${name} must not duplicate the summary markup`);
  }
});
