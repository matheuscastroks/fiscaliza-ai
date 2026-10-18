import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compareTerritoryRecords,
  withinPeriod,
} from '../../shared/territory-order.js';
import { canDeleteRecord } from '../../shared/record-deletion.js';
import type { Occurrence, Proposal } from '../../shared/contracts.js';

test('territory ordering compares citizen records across dates, supports and views without mutation', () => {
  const occurrence = {
    id: 'occ',
    reportedAt: '2026-10-18T10:00:00Z',
    votes: 2,
    views: 50,
  } as Occurrence;
  const proposal = {
    id: 'prop',
    kind: 'proposal',
    createdAt: '2026-10-16T10:00:00Z',
    supports: 12,
    views: 10,
  } as Proposal;
  assert.ok(compareTerritoryRecords(occurrence, proposal, 'date') < 0);
  assert.ok(compareTerritoryRecords(occurrence, proposal, 'views') < 0);
  assert.ok(compareTerritoryRecords(occurrence, proposal, 'supports') > 0);
  assert.equal(occurrence.votes, 2);
  const now = Date.parse('2026-10-18T12:00:00Z');
  assert.equal(withinPeriod(proposal, 1, now), false);
  assert.equal(withinPeriod(proposal, 7, now), true);
  assert.equal(withinPeriod(occurrence, 1, now), true);
});

test('deletion never reopens after municipal service or a return to pending', () => {
  const occurrence = {
    status: 'pending',
    statusHistory: [{ source: 'citizen', status: 'pending' }],
  } as Occurrence;
  assert.equal(canDeleteRecord(occurrence), true);
  assert.equal(canDeleteRecord({ ...occurrence, sector: 'Iluminação' }), false);
  assert.equal(canDeleteRecord({ ...occurrence, status: 'resolved' }), false);
  assert.equal(
    canDeleteRecord({
      ...occurrence,
      statusHistory: [
        ...occurrence.statusHistory,
        {
          source: 'management',
          status: 'pending',
          at: '',
          justification: 'Triagem',
        },
      ],
    }),
    false,
  );
  assert.equal(
    canDeleteRecord({
      kind: 'proposal',
      status: 'submitted',
      history: [],
    } as unknown as Proposal),
    true,
  );
  assert.equal(
    canDeleteRecord({ kind: 'proposal', status: 'under_review' } as Proposal),
    false,
  );
});
