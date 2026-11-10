const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('quick complaint kit: incorporates bottom sheet topic selector, inset table, smart location pill and photo guidance', () => {
  const kitPath = path.join(ROOT_DIR, 'features', 'city', 'QuickComplaintKit.tsx');
  assert.ok(fs.existsSync(kitPath), 'QuickComplaintKit.tsx must exist');

  const sheetPath = path.join(ROOT_DIR, 'features', 'city', 'ComplaintTopicSheet.tsx');
  assert.ok(fs.existsSync(sheetPath), 'ComplaintTopicSheet.tsx must exist');

  const content = fs.readFileSync(kitPath, 'utf8');
  assert.ok(content.includes('export function QuickComplaintKit'), 'Must export QuickComplaintKit');
  assert.ok(content.includes('COMPLAINT_TOPICS'), 'Must define COMPLAINT_TOPICS');
  assert.ok(content.includes('ComplaintTopicSheet'), 'Must integrate ComplaintTopicSheet bottom sheet');
  assert.ok(content.includes('insetTable'), 'Must adopt Apple Inset-Grouped table layout');
  assert.ok(content.includes('photoTipBanner'), 'Must provide clear photo tip banner for WhatsApp guidance');
  assert.ok(content.includes('wa.me/552134601746'), 'Must retain official 1746 WhatsApp endpoint');
  assert.ok(content.includes('Share.share'), 'Must retain Share.share action');
  assert.ok(content.includes('defaultLocation'), 'Must support defaultLocation prop');
  assert.ok(content.includes('showPreview'), 'Must support progressive disclosure with preview toggle');
  assert.ok(content.includes('suggestedLocationPill'), 'Must offer 1-tap suggested location pill');
  assert.ok(content.includes('Haptics'), 'Must provide haptic feedback on user actions');

  // Textarea auto-expansível sem corte de texto nos cantos
  assert.ok(content.includes('multiline'), 'Details field must be multiline');
  assert.ok(content.includes('onContentSizeChange'), 'Details field must track content size for auto-growth');
  assert.ok(content.includes('detailsTextarea'), 'Details field must apply detailsTextarea style');
  assert.ok(content.includes('borderRadius: 12'), 'Must use soft 12px corner radius instead of full pill to prevent clipping');

  // WhatsApp brand color
  assert.ok(content.includes('#25D366'), 'Must use official WhatsApp green for the send button');

  const appInputPath = path.join(ROOT_DIR, 'components', 'ui', 'AppInput.tsx');
  const appInputContent = fs.readFileSync(appInputPath, 'utf8');
  assert.ok(appInputContent.includes('borderRadius: 12'), 'AppInput multiline style must also adopt safe 12px border radius');
});

test('participate screen: adopts Apple Inset-Grouped tables and KeyboardAwareScrollView', () => {
  const screenPath = path.join(ROOT_DIR, 'app', '(tabs)', 'ParticipateScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'ParticipateScreen.tsx must exist');

  const content = fs.readFileSync(screenPath, 'utf8');
  assert.ok(content.includes('QuickComplaintKit'), 'Must render QuickComplaintKit as hero');
  assert.ok(content.includes('useTerritoryStore'), 'Must bind neighborhood from territory store');
  assert.ok(content.includes('OFFICIAL_CHANNELS'), 'Must define unified official channels list');
  assert.ok(content.includes('insetTable'), 'Must use Apple Inset-Grouped table style');
  assert.ok(content.includes('OFFICIAL_SERVICES'), 'Must render official services catalog');
  assert.ok(content.includes('agencyBadge'), 'Must display agency tags on popular services');
  assert.ok(content.includes('civicTipCard'), 'Must include map pre-check civic tip');
  assert.ok(content.includes('footerPortalButton'), 'Must include clean portal search link in footer');
  assert.ok(content.includes('KeyboardAwareScrollView'), 'Must wrap screen in KeyboardAwareScrollView to prevent inputs from being covered by keyboard');
  assert.ok(content.includes('bottomOffset'), 'Must provide bottomOffset for comfortable input clearance');

  // Verify elimination of old nested-card anti-patterns
  assert.ok(!content.includes('accountCard'), 'Must eliminate legacy accountCard');
  assert.ok(!content.includes('stepsCard'), 'Must eliminate legacy static stepsCard');
  assert.ok(!content.includes('serviceCard'), 'Must eliminate legacy standalone serviceCards with individual buttons');
});
