const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('official call: timeline component exists and formats lifecycle stages', () => {
  const timelinePath = path.join(ROOT_DIR, 'components', 'official', 'OfficialCallTimeline.tsx');
  assert.ok(fs.existsSync(timelinePath), 'OfficialCallTimeline.tsx must exist');

  const content = fs.readFileSync(timelinePath, 'utf8');
  assert.ok(content.includes('OfficialCallTimeline'), 'Must export OfficialCallTimeline');
  assert.ok(content.includes('buildTimelineSteps'), 'Must build structured timeline steps');
  assert.ok(content.includes('Chamado registrado'), 'Must include initial registration step');
  assert.ok(content.includes('Encaminhamento e análise técnica'), 'Must include analysis/routing step');
  assert.ok(content.includes('Execução do serviço'), 'Must include execution step');
  assert.ok(content.includes('Encerramento no 1746'), 'Must include closure step');
});

test('official call: details screen integrates timeline, sla badge and civic share action', () => {
  const detailsPath = path.join(ROOT_DIR, 'app', 'OfficialCallDetailsScreen.tsx');
  assert.ok(fs.existsSync(detailsPath), 'OfficialCallDetailsScreen.tsx must exist');

  const content = fs.readFileSync(detailsPath, 'utf8');
  assert.ok(content.includes('OfficialCallTimeline'), 'Must mount OfficialCallTimeline component');
  assert.ok(content.includes('slaPill'), 'Must render highlighted SLA badge');
  assert.ok(content.includes('handleShare') && content.includes('Share.share'), 'Must provide civic Share action for community groups');
  assert.ok(content.includes('Linha do tempo oficial'), 'Must feature the official timeline section');
});
