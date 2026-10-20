import type { Database, ReadDatabase } from '../../db.js';
import type pg from 'pg';
import type { BigQuery } from '@google-cloud/bigquery';
import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { syncCheckpoints, sourceSyncRuns } from '../../schema.js';
import type {
  SyncCoverage,
  SyncRunSummary,
} from '../../../../shared/contracts.js';
import { createBigQueryClient } from './client.js';
import {
  importPartition,
  type ImportPartitionOptions,
  type ImportResult,
} from './importer.js';
import { expandPartitionDateRange, assertSafeBoundedInt } from './queries.js';
import { withSourceLock } from '../sync-lock.js';
import { createSyncBudget } from '../sync-budget.js';

export async function getSyncStatus(db: ReadDatabase) {
  const [row] = await db
    .select()
    .from(syncCheckpoints)
    .where(eq(syncCheckpoints.id, 'rio1746_calls'))
    .limit(1);
  return row ?? null;
}

function publicRun(row: typeof sourceSyncRuns.$inferSelect): SyncRunSummary {
  return {
    id: row.id,
    sourceId: row.sourceId,
    status: row.status,
    coverage: row.coverage,
    requestedStart: row.requestedStart,
    requestedEnd: row.requestedEnd,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    counters: {
      received: row.receivedCount,
      imported: row.importedCount,
      updated: row.updatedCount,
      rejected: row.rejectedCount,
    },
  };
}

export async function getPublicSyncStatus(db: ReadDatabase) {
  const checkpoint = await getSyncStatus(db);
  const [latest] = await db
    .select()
    .from(sourceSyncRuns)
    .where(eq(sourceSyncRuns.sourceId, 'rio1746'))
    .orderBy(desc(sourceSyncRuns.startedAt))
    .limit(1);
  if (!checkpoint && !latest) return null;
  return {
    id: 'rio1746_calls',
    status: latest?.status ?? checkpoint?.status ?? 'idle',
    lastPartitionDate: checkpoint?.lastPartition ?? null,
    lastSyncAt: checkpoint?.lastSyncedAt?.toISOString() ?? null,
    recordsSynced: checkpoint
      ? checkpoint.recordsImported + checkpoint.recordsUpdated
      : null,
    latestRun: latest ? publicRun(latest) : null,
  };
}

export interface RangeSyncResult {
  run: SyncRunSummary;
  coverage: SyncCoverage;
  partitions: ImportResult[];
  totalFetched: number;
  totalImported: number;
  totalUpdated: number;
  durationMs: number;
}
export interface SyncOptions extends ImportPartitionOptions {
  client?: BigQuery;
}

export async function runRio1746Sync(
  db: Database,
  pool: pg.Pool,
  targetPartition: string,
  options: SyncOptions = {},
): Promise<ImportResult & { run: SyncRunSummary }> {
  const result = await runRio1746RangeSync(
    db,
    pool,
    targetPartition,
    targetPartition,
    options,
  );
  return { ...result.partitions[0], run: result.run };
}

export async function runRio1746RangeSync(
  db: Database,
  pool: pg.Pool,
  startDate: string,
  endDate: string,
  options: SyncOptions = {},
): Promise<RangeSyncResult> {
  let dates: string[];
  try {
    dates = expandPartitionDateRange(startDate, endDate);
    if (options.maxRecords !== undefined)
      assertSafeBoundedInt(options.maxRecords, 1, 50000, 'maxRecords');
  } catch {
    throw Object.assign(
      new Error('Informe uma data válida ou intervalo de até 31 dias.'),
      { statusCode: 400 },
    );
  }
  const budget = options.budget ?? createSyncBudget();
  return withSourceLock(pool, 'rio1746', async () => {
    const id = randomUUID();
    const start = Date.now();
    const results: ImportResult[] = [];
    await db.insert(sourceSyncRuns).values({
      id,
      sourceId: 'rio1746',
      status: 'running',
      coverage: 'unknown',
      requestedStart: startDate,
      requestedEnd: endDate,
    });
    try {
      const bq = options.client ?? createBigQueryClient();
      let remaining = options.maxRecords;
      for (const date of dates) {
        if (remaining !== undefined && remaining <= 0) break;
        const result = await importPartition(bq, db, date, {
          ...options,
          budget,
          maxRecords: remaining,
        });
        results.push(result);
        if (remaining !== undefined) remaining -= result.totalFetched;
        if (result.coverage !== 'complete') break;
      }
      const coverage =
        results.length === dates.length &&
        results.every((result) => result.coverage === 'complete')
          ? 'complete'
          : 'partial';
      const totalFetched = results.reduce(
        (sum, part) => sum + part.totalFetched,
        0,
      );
      const totalImported = results.reduce(
        (sum, part) => sum + part.imported,
        0,
      );
      const totalUpdated = results.reduce((sum, part) => sum + part.updated, 0);
      const [row] = await db
        .update(sourceSyncRuns)
        .set({
          status: coverage === 'complete' ? 'success' : 'partial',
          coverage,
          finishedAt: new Date(),
          receivedCount: totalFetched,
          importedCount: totalImported,
          updatedCount: totalUpdated,
          details: { partitions: results },
        })
        .where(eq(sourceSyncRuns.id, id))
        .returning();
      return {
        run: publicRun(row),
        coverage,
        partitions: results,
        totalFetched,
        totalImported,
        totalUpdated,
        durationMs: Date.now() - start,
      };
    } catch (error) {
      await db
        .update(sourceSyncRuns)
        .set({
          status: 'failed',
          coverage: 'unknown',
          finishedAt: new Date(),
          receivedCount: results.reduce((n, part) => n + part.totalFetched, 0),
          importedCount: results.reduce((n, part) => n + part.imported, 0),
          updatedCount: results.reduce((n, part) => n + part.updated, 0),
          details: {
            error: 'Upstream synchronization failed.',
            partitions: results,
          },
        })
        .where(eq(sourceSyncRuns.id, id));
      throw error;
    }
  });
}
