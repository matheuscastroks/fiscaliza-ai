import test from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { mapRawRowToOfficialCall } from '../src/integrations/rio1746/mapper.js';
import {
  assertValidPartitionDate,
  buildPartitionCallsQuery,
  buildLatestPartitionsQuery,
  expandPartitionDateRange,
  RIO1746_EXCLUDED_SENSITIVE_COLUMNS,
} from '../src/integrations/rio1746/queries.js';
import {
  deduplicateMappedCalls,
  importPartition,
} from '../src/integrations/rio1746/importer.js';
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

test('rio1746: queries use BigQuery parameters (@partitionDate, @limit) and reject SQL injection', () => {
  const callQuery = buildPartitionCallsQuery('2026-09-20', 100, 200);
  assert.ok(callQuery.query.includes('c.data_particao = DATE(@partitionDate)'));
  assert.ok(callQuery.query.includes('LIMIT @limit'));
  assert.ok(callQuery.query.includes('OFFSET @offset'));
  assert.ok(!callQuery.query.includes('2026-09-20'));
  assert.ok(!callQuery.query.includes('SELECT *'));
  assert.deepEqual(callQuery.params, {
    partitionDate: '2026-09-20',
    limit: 100,
    offset: 200,
  });

  const partitionQuery = buildLatestPartitionsQuery(7);
  assert.ok(partitionQuery.query.includes('INTERVAL @days DAY'));
  assert.ok(partitionQuery.query.includes('LIMIT @limit'));
  assert.deepEqual(partitionQuery.params, { days: 7, limit: 7 });

  assert.throws(
    () => assertValidPartitionDate("2026-09-20' OR 1=1 --"),
    /Invalid partition date format/,
  );
  assert.throws(
    () => assertValidPartitionDate('2026-02-30'),
    /Invalid calendar date/,
  );

  for (const sensitiveCol of RIO1746_EXCLUDED_SENSITIVE_COLUMNS) {
    assert.ok(
      !callQuery.query.includes(sensitiveCol),
      `Query must not expose sensitive column ${sensitiveCol}`,
    );
  }

  assert.deepEqual(expandPartitionDateRange('2026-09-18', '2026-09-20'), [
    '2026-09-18',
    '2026-09-19',
    '2026-09-20',
  ]);
  assert.equal(
    deduplicateMappedCalls([
      { externalId: '1', v: 'a' },
      { externalId: '1', v: 'b' },
      { externalId: '2', v: 'c' },
    ]).skippedDuplicates,
    1,
  );
});

test('rio1746: POST /api/rio1746/sync rejects unauthenticated callers', async (t) => {
  const app = await buildApp();
  t.after(() => app.close());

  const res = await app.inject({
    method: 'POST',
    url: '/api/rio1746/sync',
    payload: { partitionDate: '2026-09-20' },
  });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().success, false);
});

test(
  'rio1746: POST /api/rio1746/sync rejects citizen and staff roles (403) and malformed partitionDate (400)',
  {
    skip: !process.env.DATABASE_URL
      ? 'DATABASE_URL absent; skipping DB role authorization test'
      : false,
  },
  async (t) => {
    const { database } = await import('../src/db.js');
    const { seed } = await import('../src/seed-data.js');
    const { db, pool } = database();
    t.after(() => pool.end());
    await seed(db);

    const app = await buildApp();
    t.after(() => app.close());

    async function login(email: string) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email,
          password: process.env.DEMO_PASSWORD || 'Fiscaliza123!',
        },
      });
      assert.equal(response.statusCode, 200);
      return { authorization: `Bearer ${response.json().data.token}` };
    }

    const citizen = await login('beatrizarante@gmail.com');
    const staff = await login('gestao@vilaesperanca.exemplo');
    const admin = await login('admin@vilaesperanca.exemplo');

    const citizenSync = await app.inject({
      method: 'POST',
      url: '/api/rio1746/sync',
      headers: citizen,
      payload: { partitionDate: '2026-09-20' },
    });
    assert.equal(citizenSync.statusCode, 403);

    const staffSync = await app.inject({
      method: 'POST',
      url: '/api/rio1746/sync',
      headers: staff,
      payload: { partitionDate: '2026-09-20' },
    });
    assert.equal(staffSync.statusCode, 403);

    const badDateSync = await app.inject({
      method: 'POST',
      url: '/api/rio1746/sync',
      headers: admin,
      payload: { partitionDate: "2026-09-20' OR 1=1" },
    });
    assert.equal(badDateSync.statusCode, 400);

    // Verify multi-page pagination, auditable imported vs updated counts, and non-regressing checkpoint
    const { sql } = await import('drizzle-orm');
    const { officialCalls, syncCheckpoints } = await import('../src/schema.js');
    await db.execute(sql`DELETE FROM official_calls WHERE external_id IN ('test-bq-1', 'test-bq-2', 'test-bq-3')`);
    await db.execute(sql`DELETE FROM sync_checkpoints WHERE id = 'rio1746_calls'`);

    const page1: RawBigQuery1746Row[] = Array.from({ length: 10 }, (_, idx) => ({
      id_chamado: idx < 2 ? `test-bq-${idx + 1}` : 'test-bq-2', // includes duplicates in same page
      data_inicio: '2026-09-20T10:00:00',
      tipo: 'Iluminação Pública',
      subtipo: 'Reparo de luminária',
      status: 'Aberto',
      situacao: 'Não Encerrado',
      dentro_prazo: 'No Prazo',
      latitude: -22.91,
      longitude: -43.2,
      nome_bairro: 'Centro',
      data_particao: '2026-09-20',
    }));
    const page2: RawBigQuery1746Row[] = [
      {
        id_chamado: 'test-bq-3',
        data_inicio: '2026-09-20T11:00:00',
        data_fim: '2026-09-20T15:00:00',
        tipo: 'Iluminação Pública',
        subtipo: 'Reparo de luminária',
        status: 'Fechado com solução',
        situacao: 'Encerrado',
        dentro_prazo: 'No Prazo',
        latitude: -22.92,
        longitude: -43.21,
        nome_bairro: 'Copacabana',
        data_particao: '2026-09-20',
      },
    ];

    let callIndex = 0;
    const mockBq = {
      query: async () => {
        callIndex += 1;
        return [callIndex === 1 ? page1 : callIndex === 2 ? page2 : []];
      },
    } as unknown as import('@google-cloud/bigquery').BigQuery;

    const firstImport = await importPartition(mockBq, db, '2026-09-20', {
      pageSize: 10,
    });
    assert.equal(firstImport.pagesProcessed, 2);
    assert.equal(firstImport.totalFetched, 11);
    assert.equal(firstImport.skippedDuplicates, 8);
    assert.equal(firstImport.imported, 3);
    assert.equal(firstImport.updated, 0);

    // Re-import an older partition with 1 updated record and ensure lastPartition does not regress
    const mockBqUpdate = {
      query: async () => [
        [
          {
            id_chamado: 'test-bq-1',
            data_inicio: '2026-09-19T10:00:00',
            data_fim: '2026-09-20T12:00:00',
            tipo: 'Iluminação Pública',
            subtipo: 'Reparo de luminária',
            status: 'Fechado com solução',
            situacao: 'Encerrado',
            dentro_prazo: 'No Prazo',
            latitude: -22.91,
            longitude: -43.2,
            nome_bairro: 'Centro',
            data_particao: '2026-09-19',
          },
        ],
      ],
    } as unknown as import('@google-cloud/bigquery').BigQuery;

    const secondImport = await importPartition(mockBqUpdate, db, '2026-09-19', {
      pageSize: 10,
    });
    assert.equal(secondImport.imported, 0);
    assert.equal(secondImport.updated, 1);

    const [cp] = await db.select().from(syncCheckpoints);
    assert.equal(cp.lastPartition, '2026-09-20');
    assert.equal(cp.recordsImported, 3);
    assert.equal(cp.recordsUpdated, 1);

    await db.execute(sql`DELETE FROM official_calls WHERE external_id IN ('test-bq-1', 'test-bq-2', 'test-bq-3')`);
  },
);

