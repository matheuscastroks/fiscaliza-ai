import type { Database } from '../../db.js';
import { eq } from 'drizzle-orm';
import { syncCheckpoints } from '../../schema.js';
import { createBigQueryClient } from './client.js';
import {
  importPartition,
  type ImportPartitionOptions,
  type ImportResult,
} from './importer.js';
import { expandPartitionDateRange } from './queries.js';

export async function getSyncStatus(db: Database) {
  const result = await db
    .select()
    .from(syncCheckpoints)
    .where(eq(syncCheckpoints.id, 'rio1746_calls'))
    .limit(1);

  return result[0] || null;
}

export async function runRio1746Sync(
  db: Database,
  targetPartition = '2026-09-20',
  options?: number | ImportPartitionOptions,
): Promise<ImportResult> {
  const bq = createBigQueryClient();

  try {
    await db
      .insert(syncCheckpoints)
      .values({
        id: 'rio1746_calls',
        status: 'syncing',
        errorMessage: null,
      })
      .onConflictDoUpdate({
        target: syncCheckpoints.id,
        set: { status: 'syncing', errorMessage: null },
      });

    return await importPartition(bq, db, targetPartition, options);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await db
      .insert(syncCheckpoints)
      .values({
        id: 'rio1746_calls',
        status: 'failed',
        errorMessage: errorMsg,
      })
      .onConflictDoUpdate({
        target: syncCheckpoints.id,
        set: { status: 'failed', errorMessage: errorMsg },
      });

    throw err;
  }
}

export interface RangeSyncResult {
  partitions: ImportResult[];
  totalFetched: number;
  totalImported: number;
  totalUpdated: number;
  durationMs: number;
}

export async function runRio1746RangeSync(
  db: Database,
  startDate: string,
  endDate: string,
  options?: ImportPartitionOptions,
): Promise<RangeSyncResult> {
  const startTime = Date.now();
  const partitions = expandPartitionDateRange(startDate, endDate);
  const results: ImportResult[] = [];

  for (const partition of partitions) {
    const res = await runRio1746Sync(db, partition, options);
    results.push(res);
  }

  return {
    partitions: results,
    totalFetched: results.reduce((acc, r) => acc + r.totalFetched, 0),
    totalImported: results.reduce((acc, r) => acc + r.imported, 0),
    totalUpdated: results.reduce((acc, r) => acc + r.updated, 0),
    durationMs: Date.now() - startTime,
  };
}
