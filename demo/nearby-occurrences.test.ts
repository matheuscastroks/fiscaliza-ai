import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nearbyOccurrences } from '../shared/nearby-occurrences.ts';
import type { Occurrence } from '../shared/contracts.ts';

test('nearby occurrences exclude the current record, other municipalities and distant points, sorted by distance', () => {
  const make = (id: string, latitude: number, municipalityId = '3304557') =>
    ({
      id,
      municipalityId,
      location: { latitude, longitude: -43.18 },
    }) as Occurrence;
  const current = make('current', -22.904);
  const results = nearbyOccurrences(current, [
    current,
    make('further', -22.91),
    make('near', -22.905),
    make('outside', -23.1),
    make('other-city', -22.904, '9999999'),
  ]);
  assert.deepEqual(
    results.map((result) => result.item.id),
    ['near', 'further'],
  );
  assert.ok(
    results[0].distance > 0 && results[0].distance < results[1].distance,
  );
});
