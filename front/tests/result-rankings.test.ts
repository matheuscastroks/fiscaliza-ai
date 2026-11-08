import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fastestResolution,
  formatDays,
  slowestResolution,
  topByDeadlineRate,
  topByVolume,
} from '../features/city/resultRankings.ts';

const row = (neighborhood: string, count: number, rate: number | null, days: number | null, closed = count) => ({
  neighborhood, count, closedCount: closed, overdueCount: 0, withinDeadlineRate: rate, avgResolutionDays: days,
});

const rows = [
  row('Centro', 900, 60, 12),
  row('Tijuca', 500, 85, 6),
  row('Urca', 10, 100, 1),
  row('Bangu', 700, null, null, 0),
  row('Méier', 400, 85, 9),
];

test('volume ranking orders by number of calls', () => {
  assert.deepEqual(topByVolume(rows, 3).map((r) => r.neighborhood), ['Centro', 'Bangu', 'Tijuca']);
});

test('deadline ranking ignores small samples and unknown rates, ties favor volume', () => {
  assert.deepEqual(topByDeadlineRate(rows).map((r) => r.neighborhood), ['Tijuca', 'Méier', 'Centro']);
});

test('speed rankings ignore small samples and bairros without closures', () => {
  assert.deepEqual(fastestResolution(rows).map((r) => r.neighborhood), ['Tijuca', 'Méier', 'Centro']);
  assert.equal(slowestResolution(rows)[0].neighborhood, 'Centro');
});

test('days are formatted without inventing values', () => {
  assert.equal(formatDays(null), '—');
  assert.equal(formatDays(0.4), 'menos de 1 dia');
  assert.equal(formatDays(1.2), '1 dia');
  assert.equal(formatDays(6.6), '7 dias');
});
