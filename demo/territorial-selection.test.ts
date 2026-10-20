import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chooseTerritorialEntries,
  summarizeLayer,
  resolveNeighborhood,
  samePublication,
  scriptJson,
} from '../features/territory/selectors.ts';

test('official filters never remove facilities and selected layers determine map and list entries', () => {
  const facilities = [
    { id: 's', category: 'school' },
    { id: 'h', category: 'health' },
  ];
  assert.deepEqual(
    chooseTerritorialEntries([], facilities, ['official', 'school']).map(
      (x) => x.item.id,
    ),
    ['s'],
  );
  assert.deepEqual(
    chooseTerritorialEntries([{ id: 'call' }], facilities, ['health']).map(
      (x) => x.item.id,
    ),
    ['h'],
  );
});
test('partial page exposes displayed versus known total and unknown is never zero', () => {
  assert.equal(summarizeLayer(100, 1540), '100 de 1.540');
  assert.equal(summarizeLayer(0, null), 'Total indisponível');
  assert.equal(summarizeLayer(0, 0), '0 de 0');
});
test('switching neighborhood requires a unique identity and pagination cannot mix publications', () => {
  const options = [
    { id: '1', name: 'São Cristóvão' },
    { id: '2', name: 'Centro' },
  ];
  assert.equal(resolveNeighborhood('sao cristovao', options)?.id, '1');
  assert.equal(
    resolveNeighborhood('Centro', [...options, { id: '3', name: 'CENTRO' }]),
    null,
  );
  assert.equal(
    samePublication(
      [{ sourceId: 'school', publicationId: 'a' }],
      [{ sourceId: 'school', publicationId: 'b' }],
    ),
    false,
  );
});
test('map protocol cannot close its script with a source label containing markup', () => {
  const value = { title: '</script><img src=x onerror=alert(1)>\u2028' };
  const encoded = scriptJson(value);
  assert.ok(!encoded.includes('<'));
  assert.deepEqual(JSON.parse(encoded), value);
});
