import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRawRowToOfficialCall } from '../src/integrations/rio1746/mapper.js';
import { buildPartitionCallsQuery, buildLatestPartitionsQuery } from '../src/integrations/rio1746/queries.js';
import type { RawBigQuery1746Row } from '../src/integrations/rio1746/types.js';

test('rio1746: mapper maps valid row within Rio coordinates correctly', () => {
  const row: RawBigQuery1746Row = {
    id_chamado: '24002827',
    data_inicio: '2026-09-20T13:07:16',
    data_fim: null,
    tipo: 'Drenagem e Saneamento',
    subtipo: 'Manutenção de ramais',
    status: 'Aberto',
    situacao: 'Não Encerrado',
    tipo_situacao: 'Andamento',
    justificativa_status: null,
    tempo_prazo: 7,
    prazo_unidade: 'D',
    dentro_prazo: 'A Vencer (No Prazo)',
    latitude: -22.9000147,
    longitude: -43.231888,
    id_bairro: '10',
    nome_bairro: 'Imperial de São Cristóvão',
    subprefeitura: 'Centro',
    data_particao: '2026-09-20',
  };

  const mapped = mapRawRowToOfficialCall(row);

  assert.equal(mapped.id, 'rio1746-24002827');
  assert.equal(mapped.externalId, '24002827');
  assert.equal(mapped.source, 'rio1746');
  assert.equal(mapped.municipalityId, '3304557');
  assert.equal(mapped.serviceType, 'Drenagem e Saneamento');
  assert.equal(mapped.serviceSubtype, 'Manutenção de ramais');
  assert.equal(mapped.officialStatus, 'Aberto');
  assert.equal(mapped.officialSituation, 'Não Encerrado');
  assert.equal(mapped.neighborhoodName, 'Imperial de São Cristóvão');
  assert.equal(mapped.subprefecture, 'Centro');
  assert.equal(mapped.latitude, -22.9000147);
  assert.equal(mapped.longitude, -43.231888);
  assert.equal(mapped.sourcePartitionDate, '2026-09-20');
});

test('rio1746: mapper nullifies invalid or out-of-bounds coordinates while keeping record', () => {
  const rowWithZero: RawBigQuery1746Row = {
    id_chamado: '12345',
    data_inicio: '2026-09-20T10:00:00',
    tipo: 'Iluminação Pública',
    subtipo: 'Lâmpada apagada',
    latitude: 0,
    longitude: 0,
    nome_bairro: 'Tijuca',
  };
  const mappedZero = mapRawRowToOfficialCall(rowWithZero);
  assert.equal(mappedZero.latitude, null);
  assert.equal(mappedZero.longitude, null);
  assert.equal(mappedZero.neighborhoodName, 'Tijuca');

  const rowWithDistant: RawBigQuery1746Row = {
    id_chamado: '12346',
    data_inicio: '2026-09-20T10:00:00',
    tipo: 'Iluminação Pública',
    subtipo: 'Lâmpada apagada',
    latitude: -23.5505, // São Paulo
    longitude: -46.6333,
    nome_bairro: 'Centro',
  };
  const mappedDistant = mapRawRowToOfficialCall(rowWithDistant);
  assert.equal(mappedDistant.latitude, null);
  assert.equal(mappedDistant.longitude, null);
});

test('rio1746: mapper handles BigQuery value wrappers and ISO timestamps', () => {
  const row: RawBigQuery1746Row = {
    id_chamado: '99999',
    data_inicio: { value: '2026-09-20T08:00:00' },
    data_fim: { value: '2026-09-20T12:00:00' },
    tipo: 'Limpeza de logradouros',
    subtipo: 'Varrição manual',
    status: 'Fechado com solução',
    situacao: 'Encerrado',
    data_particao: { value: '2026-09-20' },
  };

  const mapped = mapRawRowToOfficialCall(row);
  assert.equal(mapped.externalId, '99999');
  assert.ok(mapped.openedAt.includes('2026-09-20'));
  assert.ok(mapped.closedAt?.includes('2026-09-20'));
  assert.equal(mapped.sourcePartitionDate, '2026-09-20');
});

test('rio1746: queries are bounded with partition filters and no SELECT *', () => {
  const callQuery = buildPartitionCallsQuery('2026-09-20', 100);
  assert.ok(callQuery.includes("c.data_particao = '2026-09-20'"));
  assert.ok(callQuery.includes('LIMIT 100'));
  assert.ok(!callQuery.includes('SELECT *'));

  const partitionQuery = buildLatestPartitionsQuery(7);
  assert.ok(partitionQuery.includes('INTERVAL 7 DAY'));
  assert.ok(partitionQuery.includes('LIMIT 7'));
});
