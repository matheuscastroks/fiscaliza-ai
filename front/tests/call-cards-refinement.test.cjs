const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('call cards: OfficialCallRow integrates smart civic metadata (relative time, SLA, protocol, agency)', () => {
  const rowPath = path.join(ROOT_DIR, 'components', 'official', 'OfficialCallRow.tsx');
  assert.ok(fs.existsSync(rowPath), 'OfficialCallRow.tsx must exist');

  const content = fs.readFileSync(rowPath, 'utf8');

  // Relative time helper and usage
  assert.ok(
    content.includes('formatRelativeTime'),
    'OfficialCallRow must format relative time (e.g. Há X dias)',
  );
  assert.ok(
    content.includes('metaChip'),
    'OfficialCallRow must render relative time in metaChip',
  );

  // SLA and overdue detection
  assert.ok(
    content.includes('resolveOfficialCallDeadline'),
    'OfficialCallRow must resolve official deadline status',
  );
  assert.ok(
    content.includes('isOverdue'),
    'OfficialCallRow must detect overdue status',
  );
  assert.ok(
    content.includes('slaBadge'),
    'OfficialCallRow must render distinct SLA badge',
  );

  // Protocol pill
  assert.ok(
    content.includes('protocolChip'),
    'OfficialCallRow must render protocolChip with monospace styling',
  );

  // Agency tag
  assert.ok(
    content.includes('agencyBadge'),
    'OfficialCallRow must render agencyBadge when organizationName is present',
  );
});

test('call cards: TerritoryPreviewCard incorporates matching civic metadata', () => {
  const previewPath = path.join(ROOT_DIR, 'components', 'territory', 'TerritoryPreviewCard.tsx');
  assert.ok(fs.existsSync(previewPath), 'TerritoryPreviewCard.tsx must exist');

  const content = fs.readFileSync(previewPath, 'utf8');

  assert.ok(
    content.includes('formatRelativeTime'),
    'TerritoryPreviewCard must support relative time',
  );
  assert.ok(
    content.includes('resolveOfficialCallDeadline'),
    'TerritoryPreviewCard must resolve deadline status',
  );
  assert.ok(
    content.includes('metadataRow'),
    'TerritoryPreviewCard must format metadata in structured metadataRow',
  );
  assert.ok(
    content.includes('protocolChip'),
    'TerritoryPreviewCard must include protocolChip',
  );
  assert.ok(
    content.includes('agencyBadge'),
    'TerritoryPreviewCard must support agencyBadge',
  );
});
