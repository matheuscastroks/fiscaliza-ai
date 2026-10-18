import assert from 'node:assert/strict';
import test from 'node:test';
import {
  civicLocation,
  civicTerritory,
  matchesNeighborhood,
  neighborhoodOptions,
  normalizeNeighborhood,
  occurrenceMatchesNeighborhood,
} from '../shared/civic-territory.ts';
import type { CivicItem, Occurrence } from '../shared/contracts.ts';

const civic = (neighborhood: string, territory?: CivicItem['territory']) =>
  ({ neighborhood, territory }) as CivicItem;
const occurrence = (neighborhood?: string) =>
  ({
    location: {
      latitude: -22.9,
      longitude: -43.2,
      address: 'Rua Centro',
      neighborhood,
    },
  }) as Occurrence;

test('normalização remove apenas espaços repetidos, caixa e acentos sem unir bairros distintos', () => {
  assert.equal(normalizeNeighborhood('  São   Cristóvão '), 'sao cristovao');
  assert.equal(
    matchesNeighborhood(civic('São Cristóvão'), 'sao cristovao'),
    true,
  );
  assert.equal(matchesNeighborhood(civic('Centro Novo'), 'Centro'), false);
  assert.equal(matchesNeighborhood(civic('Vila-Centro'), 'Vila Centro'), false);
});

test('escopo explícito prevalece e sentinelas antigas têm correspondência exata', () => {
  for (const label of [
    'Todo o município',
    'Todo o municipio',
    'Município',
    'Municipio',
    'Todos os bairros',
    '',
  ])
    assert.equal(civicTerritory(civic(label)).scope, 'municipality');
  assert.equal(civicTerritory(civic('Município Novo')).scope, 'neighborhood');
  assert.deepEqual(civicTerritory(civic('Centro', { scope: 'municipality' })), {
    scope: 'municipality',
  });
  assert.equal(
    matchesNeighborhood(
      civic('Todo o município', {
        scope: 'neighborhood',
        neighborhood: 'Centro',
      }),
      'Tijuca',
    ),
    false,
  );
});

test('bairro inclui abrangência municipal mas ocorrência sem bairro não corresponde pelo endereço', () => {
  assert.equal(matchesNeighborhood(civic('Todo o município'), 'Tijuca'), true);
  assert.equal(matchesNeighborhood(civic('Centro'), ''), true);
  assert.equal(occurrenceMatchesNeighborhood(occurrence(), 'Centro'), false);
  assert.equal(occurrenceMatchesNeighborhood(occurrence(), ''), true);
  assert.equal(
    occurrenceMatchesNeighborhood(occurrence('Centro Novo'), 'Centro'),
    false,
  );
  assert.equal(
    occurrenceMatchesNeighborhood(occurrence('São Cristóvão'), 'sao cristovao'),
    true,
  );
});

test('opções únicas incluem perfil e bairros de todos os tipos sem sentinelas municipais', () => {
  assert.deepEqual(
    neighborhoodOptions(
      [occurrence('Centro'), occurrence('centro'), occurrence()],
      [
        civic('Todo o município'),
        civic('Tijuca'),
        civic('legado', {
          scope: 'location',
          neighborhood: 'São Cristóvão',
          location: { latitude: -22.9, longitude: -43.2 },
        }),
      ],
      'Tijuca',
    ),
    ['Tijuca', 'Centro', 'São Cristóvão'],
  );
});

test('somente localização explícita e coordenadas válidas geram ponto no mapa', () => {
  assert.equal(civicLocation(civic('Centro')), undefined);
  assert.equal(civicLocation(civic('Todo o município')), undefined);
  assert.equal(
    civicLocation(
      civic('Centro', { scope: 'neighborhood', neighborhood: 'Centro' }),
    ),
    undefined,
  );
  const located = civic('Centro', {
    scope: 'location',
    neighborhood: 'Centro',
    location: { latitude: -22.9, longitude: -43.2 },
  });
  assert.deepEqual(civicLocation(located), {
    latitude: -22.9,
    longitude: -43.2,
  });
  assert.equal(
    civicLocation(
      civic('Centro', {
        scope: 'location',
        neighborhood: 'Centro',
        location: { latitude: NaN, longitude: -43.2 },
      }),
    ),
    undefined,
  );
  assert.equal(
    civicLocation(
      civic('Centro', {
        scope: 'location',
        neighborhood: 'Centro',
        location: { latitude: 91, longitude: -43.2 },
      }),
    ),
    undefined,
  );
});
