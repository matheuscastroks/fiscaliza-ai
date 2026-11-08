import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeFacilityPagination } from '../features/territory/facilityPagination.ts';

function source(overrides: {
  label?: string;
  loaded?: number;
  total?: number | null;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}) {
  return {
    label: 'escolas',
    loaded: 100,
    total: 240,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: () => {},
    ...overrides,
  };
}

test('sem camadas ativas não há controle de paginação', () => {
  assert.equal(summarizeFacilityPagination([]), undefined);
});

test('soma carregados e totais das camadas ativas', () => {
  const summary = summarizeFacilityPagination([
    source({ label: 'escolas', loaded: 100, total: 240 }),
    source({ label: 'saúde', loaded: 80, total: 120 }),
  ]);
  assert.ok(summary);
  assert.equal(summary.loadedCount, 180);
  assert.equal(summary.totalKnown, 360);
  assert.equal(summary.label, 'equipamentos');
  assert.equal(summary.hasMore, false);
});

test('continua enquanto qualquer camada tiver próxima página', () => {
  const calls: string[] = [];
  const summary = summarizeFacilityPagination([
    source({
      label: 'escolas',
      hasNextPage: true,
      fetchNextPage: () => calls.push('escolas'),
    }),
    source({
      label: 'praças',
      hasNextPage: false,
      fetchNextPage: () => calls.push('praças'),
    }),
  ]);
  assert.ok(summary);
  assert.equal(summary.hasMore, true);
  summary.fetchNextPage();
  assert.deepEqual(calls, ['escolas']);
});

test('total só é conhecido quando todas as camadas publicam o total', () => {
  const summary = summarizeFacilityPagination([
    source({ total: 240 }),
    source({ total: null }),
  ]);
  assert.ok(summary);
  assert.equal(summary.totalKnown, null);
});

test('não repete requisição de camada já carregando', () => {
  const calls: string[] = [];
  const summary = summarizeFacilityPagination([
    source({
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage: () => calls.push('carregando'),
    }),
    source({
      hasNextPage: true,
      fetchNextPage: () => calls.push('livre'),
    }),
  ]);
  assert.ok(summary);
  assert.equal(summary.isFetchingNextPage, true);
  summary.fetchNextPage();
  assert.deepEqual(calls, ['livre']);
});
