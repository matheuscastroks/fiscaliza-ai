import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chooseTerritorialEntries,
  summarizeLayer,
  resolveNeighborhood,
  samePublication,
  scriptJson,
} from '../features/territory/selectors.ts';
import {
  countLabel,
  coverageLabel,
  evidenceScope,
  periodLabel,
} from '../features/territory/evidence.ts';

test('unknown facility count is not zero and partial source never claims complete coverage', () => {
  assert.equal(countLabel(null), 'Indisponível');
  assert.equal(countLabel(0), '0');
  assert.equal(coverageLabel('partial'), 'Cobertura parcial');
  assert.equal(coverageLabel('unknown'), 'Cobertura não confirmada');
});
test('historical ranges and links preserve their evidence scope', () => {
  const dates = { startDate: '2024-01-01', endDate: '2024-01-31' };
  assert.equal(periodLabel(dates), '01/01/2024 a 31/01/2024');
  assert.deepEqual(evidenceScope('rio-neighborhood:005', 'school', dates), {
    neighborhoodId: 'rio-neighborhood:005',
    layer: 'school',
    ...dates,
  });
});

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

test('unresolved neighborhood cannot consume municipal facility cache or remove compatible calls', () => {
  const cachedFacilities = [{ id: 'municipal-school', category: 'school' }];
  const scope = {
    neighborhood: 'Nome legado sem equivalência',
    neighborhoodId: undefined,
  };
  assert.deepEqual(
    chooseTerritorialEntries(
      [{ id: 'call' }],
      cachedFacilities,
      ['official', 'school'],
      scope,
    ).map((x) => x.item.id),
    ['call'],
  );
  assert.deepEqual(
    chooseTerritorialEntries([], cachedFacilities, ['school'], {
      neighborhood: '',
    }).map((x) => x.item.id),
    ['municipal-school'],
  );
});
test('reported neighborhood names never imply a confirmed link for conflicts or boundary points', async () => {
  const { facilityNeighborhoodLabel } = await import(
    '../features/territory/selectors.ts'
  );
  assert.equal(
    facilityNeighborhoodLabel({
      neighborhoodId: null,
      neighborhoodName: 'Centro',
    }),
    'Bairro não confirmado · Informado pela fonte: Centro',
  );
  assert.equal(
    facilityNeighborhoodLabel({
      neighborhoodId: 'rio-neighborhood:005',
      neighborhoodName: 'Centro',
    }),
    'Centro',
  );
  assert.equal(
    facilityNeighborhoodLabel({ neighborhoodId: null, neighborhoodName: null }),
    'Bairro não confirmado',
  );
});
