import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  nextStatuses,
  transitionError,
  filterOccurrences,
  hasMunicipalAccess,
  civicTerritoryDraft,
  serializeCivicTerritory,
  civicTerritoryLabel,
} from './domain.ts';
import type { Occurrence, SessionUser } from '../../shared/contracts.ts';

test('painel exige conta de gestão com município autorizado na sessão', () => {
  const user: SessionUser = {
    id: 'staff',
    name: 'Equipe',
    email: 'equipe@example.test',
    role: 'staff',
  };
  const municipality = {
    id: '3304557',
    name: 'Rio de Janeiro',
    state: 'RJ',
    center: { latitude: -22.9, longitude: -43.2 },
    bounds: { north: -22.7, south: -23.1, east: -43.1, west: -43.8 },
  };
  assert.equal(hasMunicipalAccess(null), false);
  assert.equal(hasMunicipalAccess(user), false);
  assert.equal(hasMunicipalAccess({ ...user, municipality: null }), false);
  assert.equal(hasMunicipalAccess({ ...user, role: 'admin' }), false);
  assert.equal(hasMunicipalAccess({ ...user, municipality }), true);
  assert.equal(hasMunicipalAccess({ ...user, role: 'admin', municipality }), true);
  assert.equal(
    hasMunicipalAccess({ ...user, role: 'citizen', municipality }),
    false,
  );
});

test('abrangência municipal dispensa bairro e não inventa coordenadas', () => {
  assert.deepEqual(serializeCivicTerritory({ scope: 'municipality', neighborhood: '', latitude: '', longitude: '', address: '' }), {
    neighborhood: 'Todo o município', territory: { scope: 'municipality' },
  });
  assert.throws(() => serializeCivicTerritory({ scope: 'neighborhood', neighborhood: '  ', latitude: '', longitude: '', address: '' }), /bairro/i);
});

test('local específico exige coordenadas finitas no intervalo, aceitando zero', () => {
  const draft = { scope: 'location' as const, neighborhood: 'Centro', latitude: '0', longitude: '0', address: ' Rua A ' };
  assert.deepEqual(serializeCivicTerritory(draft), {
    neighborhood: 'Centro', territory: { scope: 'location', neighborhood: 'Centro', location: { latitude: 0, longitude: 0, address: 'Rua A' } },
  });
  for (const latitude of ['', ' ', 'NaN', 'Infinity', '91', '-91']) {
    assert.throws(() => serializeCivicTerritory({ ...draft, latitude }), /latitude/i);
  }
  for (const longitude of ['', 'Infinity', '181', '-181']) {
    assert.throws(() => serializeCivicTerritory({ ...draft, longitude }), /longitude/i);
  }
  assert.throws(() => serializeCivicTerritory({ ...draft, neighborhood: '' }), /bairro/i);
});

test('edição preserva a abrangência e coordenadas existentes sem usar centro municipal', () => {
  const territory = { scope: 'location' as const, neighborhood: 'Centro', location: { latitude: -22.912345678, longitude: -43.212345678, address: 'Rua A' } };
  assert.deepEqual(serializeCivicTerritory(civicTerritoryDraft({ neighborhood: 'Centro', territory })).territory, territory);
  assert.equal(civicTerritoryDraft({ neighborhood: 'Todo o município' }).scope, 'municipality');
  assert.equal(civicTerritoryDraft({ neighborhood: 'Centro' }).scope, 'neighborhood');
  assert.equal(civicTerritoryDraft({ neighborhood: 'Todo o município Norte' }).scope, 'neighborhood');
  for (const neighborhood of ['  TODO O MUNICÍPIO ', 'Município', 'municipio', 'Todos   os bairros']) {
    assert.equal(civicTerritoryDraft({ neighborhood }).scope, 'municipality');
  }
  assert.deepEqual(serializeCivicTerritory(civicTerritoryDraft({ neighborhood: ' Centro ' })), {
    neighborhood: 'Centro', territory: { scope: 'neighborhood', neighborhood: 'Centro' },
  });
  assert.deepEqual(serializeCivicTerritory(civicTerritoryDraft({ neighborhood: 'Bairro antigo', territory: { scope: 'municipality' } })), {
    neighborhood: 'Todo o município', territory: { scope: 'municipality' },
  });
  assert.equal(civicTerritoryLabel({ neighborhood: 'Centro', territory }), 'Local específico · Centro');
});
test('encaminhamento exige justificativa e setor; conclusão exige atendimento anterior', () => {
  assert.ok(transitionError('pending', 'resolved', 'feito', 'Obras'));
  assert.ok(transitionError('pending', 'in_progress', '  ', 'Obras'));
  assert.ok(
    transitionError('pending', 'in_progress', 'Vistoria agendada', ' '),
  );
  assert.equal(
    transitionError('resolved', 'in_progress', 'Revisão solicitada', 'Obras'),
    '',
  );
  assert.ok(transitionError('pending', 'pending', 'Reclassificação', 'Obras'));
  assert.equal(
    transitionError(
      'pending',
      'pending',
      'Risco técnico reavaliado',
      'Obras',
      true,
    ),
    '',
  );
  assert.ok(transitionError('pending', 'pending', '  ', 'Obras', true));
  assert.deepEqual(nextStatuses.resolved, ['in_progress']);
});
test('busca ignora acentos e combina filtros sem alterar os registros', () => {
  const items = [
    {
      id: '1',
      title: 'Iluminação na praça',
      description: 'Poste apagado',
      category: 'lighting',
      status: 'pending',
      location: { address: 'Rua A', neighborhood: 'Centro' },
    },
    {
      id: '2',
      title: 'Praça',
      description: 'Lixo',
      category: 'cleaning',
      status: 'resolved',
      location: { address: 'Rua B', neighborhood: 'Norte' },
    },
  ] as Occurrence[];
  assert.deepEqual(
    filterOccurrences(items, 'iluminacao', 'pending', 'lighting', 'Centro').map(
      (i) => i.id,
    ),
    ['1'],
  );
  assert.equal(
    filterOccurrences(items, '', 'pending', 'cleaning', '').length,
    0,
  );
  assert.equal(items.length, 2);
});
