const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('quick complaint kit: component exists and provides fast 1746 formatting', () => {
  const kitPath = path.join(ROOT_DIR, 'features', 'city', 'QuickComplaintKit.tsx');
  assert.ok(fs.existsSync(kitPath), 'QuickComplaintKit.tsx must exist');

  const content = fs.readFileSync(kitPath, 'utf8');
  assert.ok(content.includes('export function QuickComplaintKit'), 'Must export QuickComplaintKit component');
  assert.ok(content.includes('COMPLAINT_TOPICS'), 'Must define civic complaint topics');
  assert.ok(content.includes('wa.me/552134601746'), 'Must link to official 1746 WhatsApp number');
  assert.ok(content.includes('Share.share'), 'Must support sharing formatted complaint text');
  assert.ok(content.includes('defaultLocation'), 'Must accept defaultLocation prop');
});

test('participate screen: integrates QuickComplaintKit with territory location', () => {
  const screenPath = path.join(ROOT_DIR, 'app', '(tabs)', 'ParticipateScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'ParticipateScreen.tsx must exist');

  const content = fs.readFileSync(screenPath, 'utf8');
  assert.ok(content.includes('QuickComplaintKit'), 'Must import and mount QuickComplaintKit');
  assert.ok(content.includes('useTerritoryStore'), 'Must use territory store for neighborhood context');
  assert.ok(content.includes('<QuickComplaintKit'), 'Must render QuickComplaintKit in the scroll tree');
});
