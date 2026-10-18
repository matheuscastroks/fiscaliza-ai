import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cityExamples } from '../src/city-examples.js';

test('city examples have distinct photos, complete context and proposals with a separate summary', () => {
  const {occurrences,proposals} = cityExamples('2026-10-18T12:00:00Z');
  const all = [...occurrences,...proposals];
  assert.equal(new Set(all.map(item => item.id)).size, all.length);
  assert.equal(new Set(all.map(item => item.images![0])).size, all.length);
  for (const item of occurrences) {
    assert.ok(item.description.length > 80);
    assert.ok(item.location.address && item.location.neighborhood);
    assert.ok(item.statusHistory.length);
  }
  for (const item of proposals) {
    assert.notEqual(item.summary,item.body);
    assert.ok(item.body.length > item.summary.length);
    assert.ok(item.responsible);
    assert.ok(item.linkedIds.every(id => occurrences.some(occurrence => occurrence.id === id)));
  }
});
