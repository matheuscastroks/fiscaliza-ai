import type { BigQuery } from '@google-cloud/bigquery';
import { sql } from 'drizzle-orm';
import type { Database } from '../../db.js';
import { officialCalls, syncCheckpoints } from '../../schema.js';
import { buildPartitionCallsQuery } from './queries.js';
import { mapRawRowToOfficialCall } from './mapper.js';
import type { RawBigQuery1746Row } from './types.js';
import type { SyncCoverage } from '../../../../shared/contracts.js';
import {
  createSyncBudget,
  runBudgetedQuery,
  SyncBudgetExceeded,
  type SyncBudget,
} from '../sync-budget.js';

export interface ImportResult {
  coverage: SyncCoverage;
  partition: string;
  pagesProcessed: number;
  totalFetched: number;
  imported: number;
  updated: number;
  skippedDuplicates: number;
  durationMs: number;
}

export interface ImportPartitionOptions {
  budget?: SyncBudget;
  /** Maximum records to import in total across pages. Omit or set undefined to import the entire partition. */
  maxRecords?: number;
  /** Number of rows fetched per BigQuery page (default: 2500). */
  pageSize?: number;
}

export function deduplicateMappedCalls<T extends { externalId: string }>(
  items: T[],
): { unique: T[]; skippedDuplicates: number } {
  const byExternalId = new Map<string, T>();
  let skippedDuplicates = 0;
  for (const item of items) {
    if (byExternalId.has(item.externalId)) {
      skippedDuplicates += 1;
    }
    byExternalId.set(item.externalId, item);
  }
  return { unique: Array.from(byExternalId.values()), skippedDuplicates };
}

export async function importPartition(
  bq: BigQuery,
  db: Database,
  partitionDate: string,
  options: number | ImportPartitionOptions = {},
): Promise<ImportResult> {
  const startTime = Date.now();
  const normalizedOptions: ImportPartitionOptions =
    typeof options === 'number' ? { maxRecords: options } : options;

  const pageSize = Math.min(
    5000,
    Math.max(10, normalizedOptions.pageSize ?? 2500),
  );
  const maxRecords = normalizedOptions.maxRecords;
  const budget = normalizedOptions.budget ?? createSyncBudget();
  let coverage: SyncCoverage = 'partial';

  let offset = 0;
  let pagesProcessed = 0;
  let totalFetched = 0;
  let imported = 0;
  let updated = 0;
  let skippedDuplicates = 0;

  while (true) {
    const remainingBudget =
      maxRecords !== undefined
        ? Math.max(0, maxRecords - totalFetched)
        : pageSize;
    if (maxRecords !== undefined && remainingBudget === 0) {
      break;
    }

    const fetchLimit = Math.min(pageSize, remainingBudget);
    const { query, params } = buildPartitionCallsQuery(
      partitionDate,
      fetchLimit,
      offset,
    );

    let rows: unknown[];
    try {
      rows = await runBudgetedQuery(bq, { query, params }, budget);
    } catch (error) {
      if (error instanceof SyncBudgetExceeded) break;
      throw error;
    }

    const rawRows = rows as RawBigQuery1746Row[];
    if (rawRows.length === 0) {
      coverage = 'complete';
      break;
    }

    pagesProcessed += 1;
    totalFetched += rawRows.length;

    const mapped = rawRows.map(mapRawRowToOfficialCall);
    const deduped = deduplicateMappedCalls(mapped);
    skippedDuplicates += deduped.skippedDuplicates;

    // Insert in batches of 200 to stay well within pg parameter limits
    const batchSize = 200;
    for (let i = 0; i < deduped.unique.length; i += batchSize) {
      const chunk = deduped.unique.slice(i, i + batchSize);
      const values = chunk.map((c) => ({
        ...c,
        openedAt: new Date(c.openedAt),
        closedAt: c.closedAt ? new Date(c.closedAt) : null,
        targetDate: c.targetDate ? new Date(c.targetDate) : null,
        sourcePartitionDate: c.sourcePartitionDate || null,
        importedAt: new Date(),
        updatedAt: new Date(),
      }));

      const upsertedRows = await db
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
            neighborhoodId: sql`excluded.neighborhood_id`,
            neighborhoodName: sql`excluded.neighborhood_name`,
            subprefecture: sql`excluded.subprefecture`,
            latitude: sql`excluded.latitude`,
            longitude: sql`excluded.longitude`,
            sourcePartitionDate: sql`excluded.source_partition_date`,
            updatedAt: new Date(),
          },
        })
        .returning({
          inserted: sql<boolean>`(xmax = 0)`,
        });

      for (const row of upsertedRows) {
        if (row.inserted) {
          imported += 1;
        } else {
          updated += 1;
        }
      }
    }

    offset += rawRows.length;
    if (rawRows.length < fetchLimit) {
      coverage = 'complete';
      break;
    }
  }

  // Record auditable checkpoint without regressing lastPartition
  await db
    .insert(syncCheckpoints)
    .values({
      id: 'rio1746_calls',
      lastPartition: coverage === 'complete' ? partitionDate : null,
      recordsImported: imported,
      recordsUpdated: updated,
      status: coverage === 'complete' ? 'success' : 'partial',
      lastSyncedAt: coverage === 'complete' ? new Date() : null,
      errorMessage: null,
    })
    .onConflictDoUpdate({
      target: syncCheckpoints.id,
      set: {
        ...(coverage === 'complete'
          ? {
              lastPartition: sql`GREATEST(COALESCE(${syncCheckpoints.lastPartition}, ''), ${partitionDate})`,
              lastSyncedAt: new Date(),
            }
          : {}),
        recordsImported: sql`COALESCE(${syncCheckpoints.recordsImported}, 0) + ${imported}`,
        recordsUpdated: sql`COALESCE(${syncCheckpoints.recordsUpdated}, 0) + ${updated}`,
        status: coverage === 'complete' ? 'success' : 'partial',
        errorMessage: null,
      },
    });

  return {
    coverage,
    partition: partitionDate,
    pagesProcessed,
    totalFetched,
    imported,
    updated,
    skippedDuplicates,
    durationMs: Date.now() - startTime,
  };
}
