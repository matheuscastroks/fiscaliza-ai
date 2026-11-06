import test from 'node:test';
import assert from 'node:assert/strict';
import { toOfficialCallsParams, validatePlace, restoreSelection } from '../features/places/selection.ts';

test('radius never accumulates a neighborhood filter', () => {
  assert.deepEqual(toOfficialCallsParams({ kind: 'radius', source: 'current', latitude: -22.9, longitude: -43.2, radiusMeters: 1000, neighborhood: { id: 'n', name: 'Centro' } }), {
    centerLatitude: -22.9, centerLongitude: -43.2, radiusMeters: 1000,
  });
  assert.deepEqual(toOfficialCallsParams({ kind: 'neighborhood', id: 'n', name: 'Centro' }), { neighborhoodId: 'n' });
  assert.deepEqual(toOfficialCallsParams({ kind: 'municipality' }), {});
});

test('place validates required point, name, text length and radius', () => {
  const place = { name: 'Casa', addressLabel: '', latitude: -22.9, longitude: -43.2, radiusMeters: 1000 };
  assert.equal(validatePlace(place), null);
  for (const value of [{ ...place, name: ' ' }, { ...place, name: 'x'.repeat(41) }, { ...place, addressLabel: 'x'.repeat(161) }, { ...place, latitude: NaN }, { ...place, longitude: 181 }, { ...place, radiusMeters: 750 }]) {
    assert.equal(typeof validatePlace(value), 'string');
  }
});

test('restoring current location drops coordinates and requires a new capture', () => {
  const current = { kind: 'radius', source: 'current', latitude: -22.9, longitude: -43.2, radiusMeters: 1000, neighborhood: null };
  assert.deepEqual(restoreSelection(current, []), { kind: 'pending-current', radiusMeters: 1000 });
  assert.deepEqual(restoreSelection({ kind: 'radius', source: 'place', placeId: 'gone' }, []), { kind: 'municipality' });
});
