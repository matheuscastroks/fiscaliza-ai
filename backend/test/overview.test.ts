import test from 'node:test';
import assert from 'node:assert/strict';
import type { CivicItem, CivicTerritory, Occurrence } from '../../shared/contracts.js';
import { summarizeOverview } from '../src/overview.js';

function civic(kind: CivicItem['kind'], neighborhood: string, territory?: CivicTerritory): CivicItem {
  const base = { id: kind, municipalityId: '3304557', title: kind, summary: 'Resumo', body: 'Texto',
    neighborhood, territory, createdBy: 'staff', createdAt: '2026-10-17T00:00:00Z', responsible: 'Obras',
    comments: [], supports: 0, linkedIds: [] };
  if (kind === 'proposal') return { ...base, kind, status: 'submitted' };
  if (kind === 'consultation') return { ...base, kind, status: 'open', closesAt: '2027-01-01T00:00:00Z',
    options: ['A', 'B'], answerCounts: [0, 0] };
  return { ...base, kind, status: 'planned', progress: 0, dueAt: '2027-01-01T00:00:00Z', evidence: [], updates: [] };
}
function occurrence(neighborhood?: string, resolved = false): Occurrence {
  return { id: 'occurrence', title: 'Relato', description: 'Texto', category: 'road',
    status: resolved ? 'resolved' : 'pending', priority: 'medium',
    location: { latitude: -22.904, longitude: -43.186, address: 'Praça', neighborhood },
    images: [], reportedBy: 'citizen', reportedAt: '2026-10-17T00:00:00Z', votes: 0, comments: [], statusHistory: [] };
}

test('citywide initiatives keep totals and their scope without producing a fictitious neighborhood', () => {
  const result = summarizeOverview([
    civic('proposal', 'Centro', { scope: 'municipality' }),
    civic('consultation', '  TODO O MUNICÍPIO  '),
    civic('action', 'Todos   os bairros'),
    civic('proposal', ''),
    civic('consultation', 'Município'),
  ]);
  assert.deepEqual(result, {
    occurrences: 0, resolved: 0, proposals: 2, consultations: 2, actions: 1,
    municipalScope: { proposals: 2, consultations: 2, actions: 1 }, neighborhoods: [],
  });
});

test('normalized neighborhood keys combine occurrences and every initiative kind', () => {
  const result = summarizeOverview([
    occurrence(' Centro ', true), occurrence('centro'),
    civic('proposal', 'Legacy ignored', { scope: 'neighborhood', neighborhood: 'CENTRO' }),
    civic('consultation', 'centro'),
    civic('action', 'Legacy ignored', { scope: 'location', neighborhood: ' centro ',
      location: { latitude: -22.904, longitude: -43.186 } }),
    occurrence('São   José'), civic('action', 'sao jose'),
    civic('action', 'Todo o município', { scope: 'municipality' }),
  ]);
  assert.deepEqual(result.municipalScope, { proposals: 0, consultations: 0, actions: 1 });
  assert.deepEqual(result.neighborhoods, [
    { name: 'Centro', occurrences: 2, resolved: 1, proposals: 1, consultations: 1, actions: 1 },
    { name: 'São José', occurrences: 1, resolved: 0, proposals: 0, consultations: 0, actions: 1 },
  ]);
  assert.equal(result.actions, 3);
  assert.equal(result.occurrences, 3);
  assert.equal(result.resolved, 1);
  assert.equal(result.proposals, 1);
  assert.equal(result.consultations, 1);
});

test('occurrences with absent or blank neighborhood share an informative bucket', () => {
  const result = summarizeOverview([occurrence(), occurrence('   ', true)]);
  assert.deepEqual(result.neighborhoods, [{ name: 'Sem bairro informado', occurrences: 2,
    resolved: 1, proposals: 0, consultations: 0, actions: 0 }]);
  assert.deepEqual(result.municipalScope, { proposals: 0, consultations: 0, actions: 0 });
  assert.deepEqual(summarizeOverview([]).neighborhoods, []);
});
