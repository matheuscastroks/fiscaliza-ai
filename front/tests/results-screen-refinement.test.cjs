const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const read = () => fs.readFileSync(path.join(ROOT_DIR, 'app', 'ResultsScreen.tsx'), 'utf8');

test('results screen: keeps 3-KPI civic dashboard with citywide benchmark', () => {
  const content = read();
  assert.ok(content.includes('Cumprimento de prazo'), 'Must include SLA deadline compliance KPI');
  assert.ok(content.includes('Taxa de conclusão'), 'Must include resolution rate KPI');
  assert.ok(content.includes('Total registrado'), 'Must include total volume KPI');
  assert.ok(content.includes('cityOverviewQuery'), 'Must compare with citywide overview');
});

test('results screen: replaces closed-call history with territorial and service rankings', () => {
  const content = read();
  assert.ok(!content.includes('useInfiniteOfficialCalls'), 'History list must be removed');
  assert.ok(!content.includes('HISTÓRICO DE ATENDIMENTOS'), 'History section must be removed');
  for (const title of [
    'BAIRROS COM MAIS CHAMADOS',
    'PROBLEMAS MAIS REGISTRADOS',
    'BAIRROS QUE MAIS CUMPREM O PRAZO',
    'RESOLUÇÃO MAIS RÁPIDA',
    'RESOLUÇÃO MAIS LENTA',
    'VELOCIDADE DE RESOLUÇÃO',
  ]) {
    assert.ok(content.includes(title), `Must render ${title}`);
  }
  assert.ok(content.includes('MIN_RANKING_VOLUME'), 'Must disclose minimum sample for rankings');
});

test('results screen: rankings drill into the neighborhood and keep official sources', () => {
  const content = read();
  assert.ok(content.includes('openNeighborhood'), 'Ranking rows must select the neighborhood');
  assert.ok(content.includes('Carta de Serviços') && content.includes('DATA.RIO'));
  assert.ok(content.includes('impactAsync'), 'Must include haptic feedback');
});
