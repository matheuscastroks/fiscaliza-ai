import type { BigQuery } from '@google-cloud/bigquery';
import { sql } from 'drizzle-orm';
import type { Database } from '../../db.js';
import { officialCalls, syncCheckpoints } from '../../schema.js';
import { buildPartitionCallsQuery } from './queries.js';
import { mapRawRowToOfficialCall } from './mapper.js';
import type { RawBigQuery1746Row } from './types.js';

export interface ImportResult {
  partition: string;
  totalFetched: number;
  imported: number;
  updated: number;
  durationMs: number;
}

export async function importPartition(
  bq: BigQuery,
  db: Database,
  partitionDate: string,
  limit = 2000,
): Promise<ImportResult> {
  const startTime = Date.now();
  const query = buildPartitionCallsQuery(partitionDate, limit);

  // Conservative safety threshold: 500 MB maximum billed bytes
  const [rows] = await bq.query({
    query,
    maximumBytesBilled: '500000000',
  });

  const rawRows = rows as RawBigQuery1746Row[];
  const mapped = rawRows.map(mapRawRowToOfficialCall);

  let imported = 0;
  let updated = 0;

  // Insert in batches of 200 to prevent parameter limit issues in pg driver
  const batchSize = 200;
  for (let i = 0; i < mapped.length; i += batchSize) {
    const chunk = mapped.slice(i, i + batchSize);

    // Prepare dates for pg-drizzle insert
    const values = chunk.map((c) => ({
      ...c,
      openedAt: new Date(c.openedAt),
      closedAt: c.closedAt ? new Date(c.closedAt) : null,
      targetDate: c.targetDate ? new Date(c.targetDate) : null,
      sourcePartitionDate: c.sourcePartitionDate || null,
      importedAt: new Date(),
      updatedAt: new Date(),
    }));

    await db
      .insert(officialCalls)
      .values(values)
      .onConflictDoUpdate({
        target: officialCalls.externalId,
        set: {
          serviceCategory: sql`excluded.service_category`,
          serviceType: sql`excluded.service_type`,
          serviceSubtype: sql`excluded.service_subtype`,
          organizationName: sql`excluded.organization_name`,
          officialStatus: sql`excluded.official_status`,
          officialSituation: sql`excluded.official_situation`,
          officialSituationType: sql`excluded.official_situation_type`,
          statusJustification: sql`excluded.status_justification`,
          closedAt: sql`excluded.closed_at`,
          targetDate: sql`excluded.target_date`,
          withinDeadline: sql`excluded.within_deadline`,
          timeRemaining: sql`excluded.time_remaining`,
          timeUnit: sql`excluded.time_unit`,
          neighborhoodName: sql`excluded.neighborhood_name`,
          subprefecture: sql`excluded.subprefecture`,
          latitude: sql`excluded.latitude`,
          longitude: sql`excluded.longitude`,
          updatedAt: new Date(),
        },
      });

    imported += chunk.length;
  }

  // Record checkpoint
  await db
    .insert(syncCheckpoints)
    .values({
      id: 'rio1746_calls',
      lastPartition: partitionDate,
      recordsImported: imported,
      recordsUpdated: updated,
      status: 'success',
      lastSyncedAt: new Date(),
      errorMessage: null,
    })
    .onConflictDoUpdate({
      target: syncCheckpoints.id,
      set: {
        lastPartition: partitionDate,
        recordsImported: sql`sync_checkpoints.records_imported + ${imported}`,
        status: 'success',
        lastSyncedAt: new Date(),
        errorMessage: null,
      },
    });

  return {
    partition: partitionDate,
    totalFetched: rawRows.length,
    imported,
    updated,
    durationMs: Date.now() - startTime,
  };
}
