const { test } = require('node:test');
const assert = require('node:assert/strict');
const dates = require('@/features/city/formatDates');

test('date-only values keep their published day regardless of time zone', () => {
  assert.equal(dates.formatCallDate('2026-10-01'), '01/10/2026');
  const parsed = dates.parseCallDate('2026-10-01');
  assert.deepEqual([parsed.getFullYear(), parsed.getMonth(), parsed.getDate()], [2026, 9, 1]);
});

test('a date-only deadline lasts until the end of that local day', () => {
  const end = new Date(dates.deadlineInstant('2026-10-01'));
  assert.deepEqual([end.getDate(), end.getHours(), end.getMinutes()], [1, 23, 59]);
  assert.ok(Number.isNaN(dates.deadlineInstant('texto')));
});

test('time remaining uses the right unit, and M means months', () => {
  assert.equal(dates.formatTimeRemainingShort(3, 'M'), '3 m');
  assert.equal(dates.formatTimeRemaining(3, 'M'), '3 meses');
  assert.equal(dates.formatTimeRemaining(1, 'D'), '1 dia');
  assert.equal(dates.formatTimeRemainingShort(2, 'H'), '2h');
  assert.equal(dates.formatTimeRemaining(0, 'D'), null);
});

test('postal code helper keeps only digits and masks them', () => {
  const { formatPostalCode, onlyDigits } = require('@/features/profile/postalCodeFormat');
  assert.equal(formatPostalCode('20040020'), '20040-020');
  assert.equal(formatPostalCode('20a04-0020999'), '20040-020');
  assert.equal(onlyDigits('20040-020'), '20040020');
});

test('territory filters reset to the open-calls default', () => {
  const { useTerritoryFilterStore } = require('@/stores/territoryFilterStore');
  const store = useTerritoryFilterStore;
  store.getState().setFilter('search', 'buraco');
  store.getState().setFilter('status', 'all');
  store.getState().reset();
  assert.equal(store.getState().search, '');
  assert.equal(store.getState().status, 'Não Encerrado');
});

test('write queue runs tasks in order and survives a failing task', async () => {
  const { createWriteQueue, createScopeGeneration, scopedStorageKey } = require('@/stores/scopedPersistence');
  const enqueue = createWriteQueue();
  const order = [];
  const first = enqueue(async () => { await new Promise((r) => setTimeout(r, 15)); order.push('first'); });
  const failing = enqueue(async () => { order.push('failing'); throw new Error('disk'); });
  const last = enqueue(async () => { order.push('last'); return 'ok'; });
  await first;
  await assert.rejects(failing, /disk/);
  assert.equal(await last, 'ok');
  assert.deepEqual(order, ['first', 'failing', 'last']);

  const scope = createScopeGeneration();
  const before = scope.current();
  scope.next();
  assert.equal(scope.isCurrent(before), false);
  assert.equal(scopedStorageKey('places', null, '3304557'), 'fiscaliza-ai:places:anonymous:3304557:v1');
  assert.equal(scopedStorageKey('places', 'u1', '3304557'), 'fiscaliza-ai:places:u1:3304557:v1');
});
