import type { Database } from '../../db.js';
import { eq } from 'drizzle-orm';
import { syncCheckpoints } from '../../schema.js';
import { createBigQueryClient } from './client.js';
import { importPartition, type ImportResult } from './importer.js';

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
  limit = 2000,
): Promise<ImportResult> {
  const bq = createBigQueryClient();

  try {
    // Mark status as syncing
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

    const result = await importPartition(bq, db, targetPartition, limit);
    return result;
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
