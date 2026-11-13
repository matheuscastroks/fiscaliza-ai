import type { BigQuery } from '@google-cloud/bigquery';
import { inArray, sql } from 'drizzle-orm';
import type { Database } from '../../db.js';
import { officialCalls, syncCheckpoints } from '../../schema.js';
import {
  buildPartitionCallsQuery,
  buildTrackedCallsQuery,
  TRACKED_IDS_PER_QUERY,
  type ParameterizedBigQuery,
} from './queries.js';
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
  /** Linhas descartadas por não terem data de abertura publicada. */
  rejected: number;
  durationMs: number;
}

export interface CallStatusChange {
  callId: string;
  serviceType: string;
  status: string | null;
  situation: string | null;
}

export interface ImportPartitionOptions {
  budget?: SyncBudget;
  /**
   * Chamados que já existiam e mudaram de status ou situação nesta página.
   * Quem chama decide o que fazer (por exemplo, avisar quem acompanha); falhas
   * aqui não interrompem a importação.
   */
  onStatusChanges?: (changes: CallStatusChange[]) => Promise<void>;
  /** Maximum records to import in total across pages. Omit or set undefined to import the entire partition. */
  maxRecords?: number;
  /** Number of rows fetched per BigQuery page (default: 2500). */
  pageSize?: number;
  /** Tentativas extras para uma consulta ao BigQuery que falhou (com espera crescente). */
  retries?: number;
  /** Espera base entre tentativas, em ms (padrão 1000). */
  retryDelayMs?: number;
}

// Colunas que vêm da fonte oficial (tudo que o upsert pode mudar).
const CONTENT_COLUMNS = [
  'service_category',
  'service_type',
  'service_subtype',
  'organization_name',
  'official_status',
  'official_situation',
  'official_situation_type',
  'status_justification',
  'closed_at',
  'target_date',
  'diagnosis_target_date',
  'within_deadline',
  'time_remaining',
  'time_unit',
  'deadline_type',
  'complaints_count',
  'street_name',
  'neighborhood_id',
  'neighborhood_name',
  'subprefecture',
  'latitude',
  'longitude',
  'source_partition_date',
];

async function withRetries<T>(
  run: () => Promise<T>,
  retries: number,
  baseDelayMs: number,
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      // Estourar o orçamento não é falha transitória.
      if (error instanceof SyncBudgetExceeded || attempt >= retries) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, baseDelayMs * 2 ** attempt),
      );
    }
  }
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

type PageCounters = Omit<ImportResult, 'partition' | 'durationMs'>;

/**
 * Lê páginas de uma consulta ordenada por `id_chamado` (cursor `afterId`) e
 * grava cada página numa transação. Serve à partição diária e à revisita.
 */
async function importPages(
  bq: BigQuery,
  db: Database,
  buildQuery: (limit: number, afterId: string | undefined) => ParameterizedBigQuery,
  normalizedOptions: ImportPartitionOptions,
): Promise<PageCounters> {

  const pageSize = Math.min(
    5000,
    Math.max(10, normalizedOptions.pageSize ?? 2500),
  );
  const maxRecords = normalizedOptions.maxRecords;
  const budget = normalizedOptions.budget ?? createSyncBudget();
  let coverage: SyncCoverage = 'partial';

  let pagesProcessed = 0;
  let totalFetched = 0;
  let imported = 0;
  let updated = 0;
  let skippedDuplicates = 0;
  let rejected = 0;
  let afterId: string | undefined;

  while (true) {
    const remainingBudget =
      maxRecords !== undefined
        ? Math.max(0, maxRecords - totalFetched)
        : pageSize;
    if (maxRecords !== undefined && remainingBudget === 0) {
      break;
    }

    const fetchLimit = Math.min(pageSize, remainingBudget);
    const { query, params } = buildQuery(fetchLimit, afterId);

    let rows: unknown[];
    try {
      rows = await withRetries(
        () => runBudgetedQuery(bq, { query, params }, budget),
        normalizedOptions.retries ?? 0,
        normalizedOptions.retryDelayMs ?? 1000,
      );
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

    afterId = String(rawRows[rawRows.length - 1].id_chamado);
    const mapped = rawRows.map(mapRawRowToOfficialCall);
    const withDate = mapped.filter(
      (call): call is typeof call & { openedAt: string } => call.openedAt !== null,
    );
    rejected += mapped.length - withDate.length;
    const deduped = deduplicateMappedCalls(withDate);
    skippedDuplicates += deduped.skippedDuplicates;

    // Uma transação por página: ou a página inteira entra, ou nada dela.
    // Lotes de 200 para ficar longe do limite de parâmetros do pg.
    const batchSize = 200;
    const pageChanges: CallStatusChange[] = [];
    await db.transaction(async (tx) => {
      for (let i = 0; i < deduped.unique.length; i += batchSize) {
        const chunk = deduped.unique.slice(i, i + batchSize);
        const values = chunk.map((c) => ({
          ...c,
          openedAt: new Date(c.openedAt),
          closedAt: c.closedAt ? new Date(c.closedAt) : null,
          targetDate: c.targetDate ? new Date(c.targetDate) : null,
          diagnosisTargetDate: c.diagnosisTargetDate
            ? new Date(c.diagnosisTargetDate)
            : null,
          sourcePartitionDate: c.sourcePartitionDate || null,
          importedAt: new Date(),
          updatedAt: new Date(),
        }));

        const previous = await tx
          .select({
            externalId: officialCalls.externalId,
            status: officialCalls.officialStatus,
            situation: officialCalls.officialSituation,
          })
          .from(officialCalls)
          .where(
            inArray(
              officialCalls.externalId,
              chunk.map((c) => c.externalId),
            ),
          );
        const before = new Map(previous.map((row) => [row.externalId, row]));
        for (const c of chunk) {
          const old = before.get(c.externalId);
          if (
            old !== undefined &&
            (old.status !== c.officialStatus ||
              old.situation !== c.officialSituation)
          )
            pageChanges.push({
              callId: c.id,
              serviceType: c.serviceType,
              status: c.officialStatus,
              situation: c.officialSituation,
            });
        }

        const upsertedRows = await tx
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
              diagnosisTargetDate: sql`excluded.diagnosis_target_date`,
              withinDeadline: sql`excluded.within_deadline`,
              timeRemaining: sql`excluded.time_remaining`,
              timeUnit: sql`excluded.time_unit`,
              deadlineType: sql`excluded.deadline_type`,
              complaintsCount: sql`excluded.complaints_count`,
              streetName: sql`excluded.street_name`,
              neighborhoodId: sql`excluded.neighborhood_id`,
              neighborhoodName: sql`excluded.neighborhood_name`,
              subprefecture: sql`excluded.subprefecture`,
              latitude: sql`excluded.latitude`,
              longitude: sql`excluded.longitude`,
              sourcePartitionDate: sql`excluded.source_partition_date`,
              updatedAt: new Date(),
            },
            // Linha igual à que já existe não é reescrita.
            setWhere: sql`(${sql.raw(
              CONTENT_COLUMNS.map((column) => `official_calls.${column}`).join(', '),
            )}) IS DISTINCT FROM (${sql.raw(
              CONTENT_COLUMNS.map((column) => `excluded.${column}`).join(', '),
            )})`,
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
    });

    // Só avisa depois de a página estar gravada.
    if (pageChanges.length > 0 && normalizedOptions.onStatusChanges) {
      try {
        await normalizedOptions.onStatusChanges(pageChanges);
      } catch {
        // Aviso é secundário: o dado já foi gravado.
      }
    }

    if (rawRows.length < fetchLimit) {
      coverage = 'complete';
      break;
    }
  }

  return {
    coverage,
    pagesProcessed,
    totalFetched,
    imported,
    updated,
    skippedDuplicates,
    rejected,
  };
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
  const counters = await importPages(
    bq,
    db,
    (limit, afterId) => buildPartitionCallsQuery(partitionDate, limit, 0, afterId),
    normalizedOptions,
  );
  const { coverage, imported, updated } = counters;

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
    ...counters,
    partition: partitionDate,
    durationMs: Date.now() - startTime,
  };
}

export interface TrackedCall {
  externalId: string;
  partitionDate: string;
}

export interface TrackedImportResult extends Omit<ImportResult, 'partition'> {
  requested: number;
}

/**
 * Relê, pela partição de abertura, os chamados que alguém salvou ou acompanha.
 * Sem isso, a mudança de situação de um chamado aberto há mais de dois dias
 * nunca chegaria ao banco (a sincronização diária só relê partições recentes).
 */
export async function importTrackedCalls(
  bq: BigQuery,
  db: Database,
  tracked: TrackedCall[],
  options: ImportPartitionOptions = {},
): Promise<TrackedImportResult> {
  const startTime = Date.now();
  const total: TrackedImportResult = {
    coverage: 'complete',
    pagesProcessed: 0,
    totalFetched: 0,
    imported: 0,
    updated: 0,
    skippedDuplicates: 0,
    rejected: 0,
    durationMs: 0,
    requested: tracked.length,
  };
  // A partição tem de vir junto: sem ela a consulta varreria a tabela inteira.
  const sorted = [...tracked].sort((a, b) => a.partitionDate.localeCompare(b.partitionDate));
  for (let i = 0; i < sorted.length; i += TRACKED_IDS_PER_QUERY) {
    const chunk = sorted.slice(i, i + TRACKED_IDS_PER_QUERY);
    const partitions = chunk.map((call) => call.partitionDate);
    const ids = chunk.map((call) => call.externalId);
    const part = await importPages(
      bq,
      db,
      (limit, afterId) => buildTrackedCallsQuery(partitions, ids, limit, afterId),
      { ...options, maxRecords: undefined, pageSize: TRACKED_IDS_PER_QUERY },
    );
    total.pagesProcessed += part.pagesProcessed;
    total.totalFetched += part.totalFetched;
    total.imported += part.imported;
    total.updated += part.updated;
    total.skippedDuplicates += part.skippedDuplicates;
    total.rejected += part.rejected;
    if (part.coverage !== 'complete') {
      total.coverage = 'partial';
      break;
    }
  }
  total.durationMs = Date.now() - startTime;
  return total;
}
