import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  nextStatuses,
  transitionError,
  filterOccurrences,
  hasMunicipalAccess,
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
