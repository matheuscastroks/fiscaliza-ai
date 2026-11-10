import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { inArray } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';
import { importPartition } from '../src/integrations/rio1746/importer.js';
import { buildPartitionCallsQuery } from '../src/integrations/rio1746/queries.js';
import { mapRawRowToOfficialCall } from '../src/integrations/rio1746/mapper.js';
import { applyMigrations } from '../src/migrations.js';
import { officialCalls } from '../src/schema.js';
import { bigQueryFixture } from './bigquery-fixture.js';

const row = (id: string, extra: Record<string, unknown> = {}) => ({
  id_chamado: id,
  data_inicio: '2026-09-20T10:00:00',
  tipo: 'Iluminação Pública',
  subtipo: 'Reparo de luminária',
  status: 'Aberto',
  situacao: 'Não Encerrado',
  latitude: -22.91,
  longitude: -43.2,
  nome_bairro: 'Bairro Dados Teste',
  data_particao: '2026-09-20',
  ...extra,
});

test('importação: sem data de abertura não há data inventada', () => {
  const mapped = mapRawRowToOfficialCall({
    id_chamado: 'x',
    tipo: 'a',
  } as never);
  assert.equal(mapped.openedAt, null);
});

test('importação: a consulta pagina por chave, não por deslocamento', () => {
  const first = buildPartitionCallsQuery('2026-09-20', 100);
  assert.match(first.query, /OFFSET @offset/);
  const next = buildPartitionCallsQuery('2026-09-20', 100, 0, '123');
  assert.doesNotMatch(next.query, /OFFSET/);
  assert.match(next.query, /CAST\(c\.id_chamado AS STRING\) > @afterId/);
  assert.deepEqual(next.params, {
    partitionDate: '2026-09-20',
    limit: 100,
    afterId: '123',
  });
  assert.ok(!next.query.includes('123'));
});

test(
  'PostgreSQL: importação rejeita linha sem data, não reescreve linha igual e repete consulta que falhou',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { db, pool } = database();
    const ext = [randomUUID(), randomUUID(), randomUUID()];
    t.after(async () => {
      await db.delete(officialCalls).where(inArray(officialCalls.externalId, ext));
      await pool.end();
    });
    await applyMigrations(pool);
    const rows = [
      row(ext[0]),
      row(ext[1]),
      row(ext[2], { data_inicio: null }),
    ];
    const first = await importPartition(bigQueryFixture(() => rows), db, '2026-09-20', { pageSize: 10 });
    assert.equal(first.imported, 2);
    assert.equal(first.rejected, 1);

    const second = await importPartition(bigQueryFixture(() => rows), db, '2026-09-20', { pageSize: 10 });
    assert.equal(second.imported, 0);
    assert.equal(second.updated, 0, 'linhas iguais não são reescritas');

    const changed = [row(ext[0], { status: 'Em andamento' }), rows[1]];
    const third = await importPartition(bigQueryFixture(() => changed), db, '2026-09-20', { pageSize: 10 });
    assert.equal(third.updated, 1);

    // Uma falha de rede passageira é repetida; a página não se perde.
    let calls = 0;
    const flaky = {
      createQueryJob: async (options: { dryRun?: boolean }) => {
        if (options.dryRun)
          return [{ metadata: { statistics: { totalBytesProcessed: '1' } } }];
        calls += 1;
        if (calls === 1) throw new Error('rede');
        return [
          {
            getQueryResults: async () => [calls === 2 ? changed : []],
            getMetadata: async () => [{ statistics: { query: { totalBytesBilled: '1' } } }],
          },
        ];
      },
    } as never;
    const retried = await importPartition(flaky, db, '2026-09-20', {
      pageSize: 10,
      retries: 2,
      retryDelayMs: 1,
    });
    assert.equal(retried.coverage, 'complete');
    assert.equal(retried.totalFetched, 2);
  },
);

test(
  'PostgreSQL: filtros validam entrada, escapam curingas, têm teto de página e cache que a sincronização invalida',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const app = await buildApp();
    const { db, pool } = database();
    const ext = [randomUUID(), randomUUID()];
    t.after(async () => {
      await db.delete(officialCalls).where(inArray(officialCalls.externalId, ext));
      await app.close();
      await pool.end();
    });
    await applyMigrations(pool);
    await importPartition(bigQueryFixture(() => [row(ext[0])]), db, '2026-09-20', { pageSize: 10 });

    const get = (url: string) => app.inject({ method: 'GET', url });
    assert.equal((await get('/api/rio1746/calls?search=a&search=b')).statusCode, 400);
    assert.equal((await get('/api/rio1746/calls?page=99999999999999')).statusCode, 400);
    assert.equal((await get('/api/rio1746/calls?page=501')).statusCode, 400);
    assert.equal((await get('/api/rio1746/calls?limit=abc')).statusCode, 400);
    assert.equal((await get(`/api/rio1746/calls?search=${'x'.repeat(101)}`)).statusCode, 400);
    assert.equal((await get('/api/rio1746/overview?tipo=a&tipo=b')).statusCode, 400);

    // "%" e "_" valem como texto, não como curinga.
    for (const term of ['%', '_']) {
      const byNeighborhood = await get(`/api/rio1746/calls?bairro=${encodeURIComponent(term)}`);
      assert.equal(byNeighborhood.json().data.total, 0, `bairro=${term}`);
      const bySearch = await get(`/api/rio1746/calls?search=${encodeURIComponent(term)}`);
      assert.equal(bySearch.json().data.total, 0, `search=${term}`);
    }
    const exact = await get(`/api/rio1746/calls?bairro=${encodeURIComponent('Bairro Dados Teste')}`);
    assert.equal(exact.statusCode, 200);
    assert.equal(exact.json().data.total, 1);
    assert.match(String(exact.headers['cache-control']), /max-age=60/);

    // O resultado em cache cai quando uma sincronização grava dados novos.
    const url = `/api/rio1746/overview?bairro=${encodeURIComponent('Bairro Dados Teste')}`;
    assert.equal((await get(url)).json().data.totalCalls, 1);
    assert.equal((await get(url)).json().data.totalCalls, 1);
    await importPartition(bigQueryFixture(() => [row(ext[1])]), db, '2026-09-20', { pageSize: 10 });
    assert.equal((await get(url)).json().data.totalCalls, 2);
  },
);
