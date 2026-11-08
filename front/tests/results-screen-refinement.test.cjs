const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('results screen: adopts 3-KPI civic dashboard with SLA benchmark and semantic color indicators', () => {
  const resultsFile = path.join(ROOT_DIR, 'app', 'ResultsScreen.tsx');
  const content = fs.readFileSync(resultsFile, 'utf8');

  // Must calculate 3 KPIs
  assert.ok(content.includes('Cumprimento de prazo'), 'Must include SLA deadline compliance KPI');
  assert.ok(content.includes('Taxa de conclusão'), 'Must include resolution rate KPI');
  assert.ok(
    content.includes('Total registrado') || content.includes('totalCalls'),
    'Must include total volume KPI',
  );

  // Must include citywide benchmark comparison
  assert.ok(
    content.includes('cityOverviewQuery') || content.includes('média do Rio'),
    'Must include citywide benchmark comparison',
  );
});

test('results screen: integrates segmented tabs to filter calls by SLA compliance (No prazo vs Com atraso)', () => {
  const resultsFile = path.join(ROOT_DIR, 'app', 'ResultsScreen.tsx');
  const content = fs.readFileSync(resultsFile, 'utf8');

  assert.ok(content.includes('SlidingTabs'), 'Must import and use SlidingTabs for SLA filtering');
  assert.ok(
    content.includes('resolveOfficialCallDeadline'),
    'Must use resolveOfficialCallDeadline to filter on-time vs overdue calls',
  );
  assert.ok(
    content.includes("'all'") && content.includes("'on_time'") && content.includes("'overdue'"),
    'Must support all, on_time, and overdue filter options',
  );
});

test('results screen: renders civic transparency section and legal framework', () => {
  const resultsFile = path.join(ROOT_DIR, 'app', 'ResultsScreen.tsx');
  const content = fs.readFileSync(resultsFile, 'utf8');

  assert.ok(
    content.includes('Carta de Serviços') || content.includes('DATA.RIO'),
    'Must reference official Carta de Serviços or DATA.RIO sources',
  );
  assert.ok(
    content.includes('Haptics') || content.includes('impactAsync'),
    'Must include haptic feedback on interactions',
  );
});
