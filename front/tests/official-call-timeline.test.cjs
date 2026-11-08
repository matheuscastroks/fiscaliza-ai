const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('official call: details screen integrates timeline, sla badge and civic share action', () => {
  const detailsPath = path.join(ROOT_DIR, 'app', 'OfficialCallDetailsScreen.tsx');
  assert.ok(fs.existsSync(detailsPath), 'OfficialCallDetailsScreen.tsx must exist');

  const content = fs.readFileSync(detailsPath, 'utf8');
  assert.ok(content.includes('OfficialCallTimeline'), 'Must mount OfficialCallTimeline component');
  assert.ok(content.includes('slaPill'), 'Must render highlighted SLA badge');
  assert.ok(content.includes('handleShare') && content.includes('Share.share'), 'Must provide civic Share action for community groups');
  assert.ok(content.includes('Linha do tempo oficial'), 'Must feature the official timeline section');
});
