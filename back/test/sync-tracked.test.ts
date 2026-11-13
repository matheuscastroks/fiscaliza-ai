import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';
import { importPartition } from '../src/integrations/rio1746/importer.js';
import { buildTrackedCallsQuery } from '../src/integrations/rio1746/queries.js';
import { runRio1746RangeSync } from '../src/integrations/rio1746/sync.js';
import { applyMigrations } from '../src/migrations.js';
import { officialCalls, savedCalls } from '../src/schema.js';
import { bigQueryFixture } from './bigquery-fixture.js';
import { createCitizen } from './helpers.js';

const row = (id: string, partition: string, status: string, closed = false) => ({
  id_chamado: id,
  data_inicio: `${partition}T10:00:00`,
  data_fim: closed ? `${partition}T18:00:00` : null,
  tipo: 'Iluminação Pública',
  subtipo: 'Reparo de luminária',
  status,
  situacao: closed ? 'Encerrado' : 'Não Encerrado',
  latitude: -22.91,
  longitude: -43.2,
  nome_bairro: 'Centro',
  data_particao: partition,
});

test('revisita: consulta presa à partição de abertura e aos ids pedidos', () => {
  const { query, params } = buildTrackedCallsQuery(
    ['2026-09-14', '2026-09-14', '2026-09-20'],
    ['123', '456'],
  );
  assert.match(query, /data_particao IN UNNEST/);
  assert.match(query, /IN UNNEST\(@ids\)/);
  assert.deepEqual(params.partitions, ['2026-09-14', '2026-09-20']);
  assert.throws(() => buildTrackedCallsQuery(['2026-09-14'], ["1' OR 1=1"]));
  assert.throws(() => buildTrackedCallsQuery([], ['1']));
});

test(
  'PostgreSQL: chamado salvo aberto há mais tempo que a janela diária tem a situação atualizada',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const app = await buildApp();
    const { db, pool } = database();
    const savedOld = `tracked-${randomUUID()}`;
    const notSaved = `untracked-${randomUUID()}`;
    t.after(async () => {
      for (const id of [savedOld, notSaved])
        await db.delete(officialCalls).where(eq(officialCalls.externalId, id));
      await app.close();
      await pool.end();
    });
    await applyMigrations(pool);

    // Os dois chamados foram abertos em setembro; só um está salvo.
    await importPartition(
      bigQueryFixture(() => [
        row(savedOld, '2026-09-14', 'Aberto'),
        row(notSaved, '2026-09-14', 'Aberto'),
      ]),
      db,
      '2026-09-14',
      { pageSize: 10 },
    );
    const citizen = await createCitizen(app, db);
    await db.insert(savedCalls).values({ userId: citizen.id, callId: `rio1746-${savedOld}` });

    // Na fonte, o chamado salvo foi fechado. A janela diária (novembro) não o relê;
    // só a revisita, que pede a partição de 14/09 com o id dele.
    const queries: Array<Record<string, unknown>> = [];
    let served = false;
    const client = {
      createQueryJob: async (options: { dryRun?: boolean; params: Record<string, unknown> }) => {
        if (options.dryRun)
          return [{ metadata: { statistics: { totalBytesProcessed: '1' } } }];
        queries.push(options.params);
        const ids = options.params.ids as string[] | undefined;
        const page =
          ids && !served
            ? ids.filter((id) => id === savedOld).map((id) => row(id, '2026-09-14', 'Fechado com solução', true))
            : [];
        if (ids) served = true;
        return [
          {
            getQueryResults: async () => [page],
            getMetadata: async () => [{ statistics: { query: { totalBytesBilled: '1' } } }],
          },
        ];
      },
    } as unknown as Parameters<typeof importPartition>[0];

    const changes: string[] = [];
    const result = await runRio1746RangeSync(db, pool, '2026-11-10', '2026-11-11', {
      client,
      revisitTracked: true,
      onStatusChanges: async (list) => {
        changes.push(...list.map((change) => change.callId));
      },
    });

    const trackedQuery = queries.find((params) => Array.isArray(params.ids));
    assert.ok(trackedQuery, 'a revisita consultou o BigQuery');
    assert.ok((trackedQuery.ids as string[]).includes(savedOld));
    assert.equal((trackedQuery.ids as string[]).includes(notSaved), false);
    assert.ok((trackedQuery.partitions as string[]).includes('2026-09-14'));
    assert.equal(result.tracked?.coverage, 'complete');

    const [saved] = await db
      .select({ status: officialCalls.officialStatus, closedAt: officialCalls.closedAt })
      .from(officialCalls)
      .where(eq(officialCalls.externalId, savedOld));
    assert.equal(saved.status, 'Fechado com solução');
    assert.ok(saved.closedAt);
    assert.deepEqual(changes, [`rio1746-${savedOld}`]);
  },
);
