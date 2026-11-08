import assert from 'node:assert/strict';
import test from 'node:test';
import { breakdownShare } from '../features/city/resultBreakdown.ts';

test('percentual real separa o rótulo da largura mínima da barra', () => {
  const result = breakdownShare(10, 1000);
  assert.equal(result.share, 1);
  assert.equal(result.label, '1');
  assert.equal(result.barWidth, 2);
});

test('contagem zero não mostra barra nem rótulo inflado', () => {
  assert.deepEqual(breakdownShare(0, 1000), {
    share: 0,
    label: '0',
    barWidth: 0,
  });
  assert.deepEqual(breakdownShare(0, 0), { share: 0, label: '0', barWidth: 0 });
});

test('fração menor que um por cento usa rótulo explícito', () => {
  const result = breakdownShare(1, 10000);
  assert.equal(result.label, '<1');
  assert.equal(result.barWidth, 2);
});

test('universo completo limita o percentual a cem', () => {
  const result = breakdownShare(1200, 1000);
  assert.equal(result.share, 100);
  assert.equal(result.label, '100');
  assert.equal(result.barWidth, 100);
});

test('entradas inválidas não geram percentual', () => {
  assert.deepEqual(breakdownShare(Number.NaN, 10), {
    share: 0,
    label: '0',
    barWidth: 0,
  });
  assert.deepEqual(breakdownShare(5, 0), { share: 0, label: '0', barWidth: 0 });
  assert.deepEqual(breakdownShare(-2, 10), { share: 0, label: '0', barWidth: 0 });
});
