import type { BigQuery } from '@google-cloud/bigquery';
import type { ParameterizedBigQuery } from './rio1746/queries.js';

export interface SyncBudget {
  remainingBytes: bigint;
}
export class SyncBudgetExceeded extends Error {
  constructor() {
    super('Sync budget exhausted before starting a paid query.');
  }
}
export function createSyncBudget(
  value = process.env.RIO1746_MAX_RUN_BYTES || '500000000',
): SyncBudget {
  if (!/^[1-9]\d*$/.test(value))
    throw new Error('RIO1746_MAX_RUN_BYTES must be a positive integer.');
  return { remainingBytes: BigInt(value) };
}

export async function runBudgetedQuery(
  bq: BigQuery,
  query: ParameterizedBigQuery,
  budget: SyncBudget,
): Promise<unknown[]> {
  const allowance =
    budget.remainingBytes < 500000000n ? budget.remainingBytes : 500000000n;
  if (allowance <= 0n) throw new SyncBudgetExceeded();
  const [estimate] = await bq.createQueryJob({
    ...query,
    dryRun: true,
    useLegacySql: false,
  });
  const estimatedRaw =
    estimate.metadata?.statistics?.totalBytesProcessed ??
    estimate.metadata?.statistics?.query?.totalBytesProcessed;
  if (estimatedRaw === undefined || !/^\d+$/.test(String(estimatedRaw))) {
    throw new Error('BigQuery did not return a reliable dry-run estimate.');
  }
  if (BigInt(String(estimatedRaw)) > allowance) throw new SyncBudgetExceeded();
  // Reserve before starting: unknown/error billing consumes the whole allowance.
  budget.remainingBytes -= allowance;
  const [job] = await bq.createQueryJob({
    ...query,
    maximumBytesBilled: allowance.toString(),
    useLegacySql: false,
    jobTimeoutMs: 60000,
  });
  const [rows] = await job.getQueryResults();
  try {
    const [metadata] = await job.getMetadata();
    const billed = metadata.statistics?.query?.totalBytesBilled;
    if (billed !== undefined && /^\d+$/.test(String(billed))) {
      const charged = BigInt(String(billed));
      if (charged <= allowance) budget.remainingBytes += allowance - charged;
    }
  } catch {
    /* Keep the reservation if billing cannot be verified. */
  }
  return rows;
}
