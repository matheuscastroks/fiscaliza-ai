import test from 'node:test';
import assert from 'node:assert/strict';
import type { BigQuery } from '@google-cloud/bigquery';
import { database } from '../src/db.js';
import { bigQueryFixture } from './bigquery-fixture.js';
import { importPartition } from '../src/integrations/rio1746/importer.js';
import { runRio1746RangeSync } from '../src/integrations/rio1746/sync.js';
import { getPublicSyncStatus } from '../src/integrations/rio1746/sync.js';

test('billing project must be explicit before selecting Google credentials', async () => {
  const { createBigQueryClient } = await import(
    '../src/integrations/rio1746/client.js'
  );
  const gcp = process.env.GCP_PROJECT_ID;
  const bq = process.env.BIGQUERY_PROJECT_ID;
  try {
    delete process.env.GCP_PROJECT_ID;
    delete process.env.BIGQUERY_PROJECT_ID;
    assert.throws(() => createBigQueryClient(), /GCP_PROJECT_ID/);
  } finally {
    if (gcp === undefined) delete process.env.GCP_PROJECT_ID;
    else process.env.GCP_PROJECT_ID = gcp;
    if (bq === undefined) delete process.env.BIGQUERY_PROJECT_ID;
    else process.env.BIGQUERY_PROJECT_ID = bq;
  }
});

test(
  'failure in a later partition keeps earlier publication and hides upstream errors',
  { skip: !process.env.DATABASE_URL },
  async () => {
    const { db, pool } = database();
    let paidQueries = 0;
    try {
      const [before] = (
        await pool.query(
          "SELECT last_partition FROM sync_checkpoints WHERE id='rio1746_calls'",
        )
      ).rows;
      await assert.rejects(
        runRio1746RangeSync(db, pool, '2026-09-25', '2026-09-26', {
          client: bigQueryFixture(() => {
            if (++paidQueries === 2) throw new Error('private credential path');
            return [];
          }),
        }),
        /private credential path/,
      );
      const status = await getPublicSyncStatus(db);
      assert.equal(
        status?.lastPartitionDate,
        before?.last_partition > '2026-09-25'
          ? before.last_partition
          : '2026-09-25',
      );
      assert.equal(status?.latestRun?.status, 'failed');
      assert.equal(status?.latestRun?.coverage, 'unknown');
      assert.equal(JSON.stringify(status).includes('credential'), false);
    } finally {
      await pool.end();
    }
  },
);

test(
  'record cap cannot publish complete coverage or replace the last complete partition',
  { skip: !process.env.DATABASE_URL },
  async () => {
    const { db, pool } = database();
    try {
      const before = (
        await pool.query(
          "SELECT last_partition,last_synced_at FROM sync_checkpoints WHERE id='rio1746_calls'",
        )
      ).rows;
      const rows = Array.from({ length: 10 }, () => ({
        id_chamado: 'sync-cap-test',
        data_inicio: '2026-09-21T00:00:00',
        tipo: 'Lighting',
        subtipo: 'Repair',
      }));
      const result = await importPartition(
        bigQueryFixture(() => rows),
        db,
        '2026-09-21',
        { maxRecords: 10, pageSize: 10 },
      );
      assert.equal(result.coverage, 'partial');
      const after = (
        await pool.query(
          "SELECT last_partition,last_synced_at FROM sync_checkpoints WHERE id='rio1746_calls'",
        )
      ).rows;
      assert.deepEqual(after, before);
    } finally {
      await pool.query(
        "DELETE FROM official_calls WHERE external_id='sync-cap-test'",
      );
      await pool.end();
    }
  },
);

test(
  'range shares one budget and records partial coverage across dates',
  { skip: !process.env.DATABASE_URL },
  async () => {
    const { db, pool } = database();
    const modulePath = '../src/integrations/sync-budget.js';
    const { createSyncBudget } = await import(modulePath);
    try {
      const [before] = (
        await pool.query(
          "SELECT last_partition FROM sync_checkpoints WHERE id='rio1746_calls'",
        )
      ).rows;
      const result = await runRio1746RangeSync(
        db,
        pool,
        '2026-09-23',
        '2026-09-24',
        {
          budget: createSyncBudget('100'),
          client: bigQueryFixture(() => [], '60'),
        },
      );
      assert.equal(result.coverage, 'partial');
      assert.equal(result.partitions[0].coverage, 'complete');
      assert.equal(result.partitions[1].coverage, 'partial');
      assert.equal(result.run.status, 'partial');
      assert.equal(result.run.requestedEnd, '2026-09-24');
      const [checkpoint] = (
        await pool.query(
          "SELECT last_partition FROM sync_checkpoints WHERE id='rio1746_calls'",
        )
      ).rows;
      assert.equal(
        checkpoint.last_partition,
        before?.last_partition > '2026-09-23'
          ? before.last_partition
          : '2026-09-23',
      );
    } finally {
      await pool.end();
    }
  },
);

test('query budget is shared and rejects work before a paid job exceeds the remainder', async () => {
  const modulePath = '../src/integrations/sync-budget.js';
  const { createSyncBudget, runBudgetedQuery } = await import(modulePath);
  const paidCeilings: string[] = [];
  const client = {
    createQueryJob: async (options: {
      dryRun?: boolean;
      maximumBytesBilled?: string;
    }) => {
      if (options.dryRun)
        return [{ metadata: { statistics: { totalBytesProcessed: '60' } } }];
      paidCeilings.push(options.maximumBytesBilled!);
      return [
        {
          getQueryResults: async () => [[]],
          getMetadata: async () => [
            { statistics: { query: { totalBytesBilled: '60' } } },
          ],
        },
      ];
    },
  } as unknown as BigQuery;
  const budget = createSyncBudget('100');
  await runBudgetedQuery(client, { query: 'SELECT 1', params: {} }, budget);
  assert.equal(budget.remainingBytes, 40n);
  await assert.rejects(
    runBudgetedQuery(client, { query: 'SELECT 2', params: {} }, budget),
    /budget/i,
  );
  assert.deepEqual(paidCeilings, ['100']);
});

test('missing job billing metadata consumes the whole reserved allowance', async () => {
  const modulePath = '../src/integrations/sync-budget.js';
  const { createSyncBudget, runBudgetedQuery } = await import(modulePath);
  const client = {
    createQueryJob: async (options: { dryRun?: boolean }) =>
      options.dryRun
        ? [{ metadata: { statistics: { totalBytesProcessed: '1' } } }]
        : [
            {
              getQueryResults: async () => [[{ id: 1 }]],
              getMetadata: async () => [{}],
            },
          ],
  } as unknown as BigQuery;
  const budget = createSyncBudget('100');
  assert.deepEqual(
    await runBudgetedQuery(client, { query: 'SELECT 1', params: {} }, budget),
    [{ id: 1 }],
  );
  assert.equal(budget.remainingBytes, 0n);
});

test(
  'sync lock is shared between pools and released after failure',
  { skip: !process.env.DATABASE_URL },
  async () => {
    const modulePath = '../src/integrations/sync-lock.js';
    const { withSourceLock } = await import(modulePath);
    const api = database();
    const cli = database();
    try {
      const failure = new Error('expected failure');
      await assert.rejects(
        withSourceLock(api.pool, 'test-rio1746', async () => {
          await assert.rejects(
            withSourceLock(cli.pool, 'test-rio1746', async () => 'unreachable'),
            { statusCode: 409 },
          );
          assert.equal(
            await withSourceLock(
              cli.pool,
              'another-source',
              async () => 'independent',
            ),
            'independent',
          );
          throw failure;
        }),
        (error) => error === failure,
      );
      assert.equal(
        await withSourceLock(cli.pool, 'test-rio1746', async () => 'released'),
        'released',
      );
    } finally {
      await api.pool.end();
      await cli.pool.end();
    }
  },
);
