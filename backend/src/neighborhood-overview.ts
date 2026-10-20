import { and, eq, gte, inArray, lt, lte, or, sql, type SQL } from 'drizzle-orm';
import type { ReadDatabase } from './db.js';
import { officialCalls } from './schema.js';
import { territorialBoundaryAliases } from './territorial-schema.js';
import type { NeighborhoodOverview } from '../../shared/contracts.js';
import { assertValidPartitionDate } from './integrations/rio1746/queries.js';
import { getPublicSyncStatus } from './integrations/rio1746/sync.js';
import { normalizedName } from './integrations/siurb/mapper.js';
import {
  failPublic,
  getBoundaryRecord,
  getFacilityCounts,
  getPublicSources,
} from './public-data-repository.js';
import { queryOfficialOverview } from './official-call-overview.js';

export function officialDateConditions(start?: string, end?: string): SQL[] {
  const result: SQL[] = [];
  let lower: Date | undefined, upper: Date | undefined;
  const parse = (value: string) => {
    try {
      assertValidPartitionDate(value.slice(0, 10));
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) throw new Error();
      return date;
    } catch {
      throw failPublic(400, 'Período inválido. Use datas válidas.');
    }
  };
  if (start) {
    lower = parse(start);
    result.push(gte(officialCalls.openedAt, lower));
  }
  if (end) {
    upper = parse(end);
    result.push(
      /^\d{4}-\d{2}-\d{2}$/.test(end)
        ? lt(officialCalls.openedAt, new Date(upper.getTime() + 86400000))
        : lte(officialCalls.openedAt, upper),
    );
  }
  if (
    lower &&
    upper &&
    (end && /^\d{4}-\d{2}-\d{2}$/.test(end)
      ? lower.getTime() >= upper.getTime() + 86400000
      : upper < lower)
  )
    throw failPublic(400, 'O fim do período deve ser posterior ao início.');
  return result;
}

/** Explicit aliases first; fallback verifies BOTH cadastral code and exact normalized name. */
export async function officialTerritoryScope(db: ReadDatabase, id: string) {
  if (!/^rio-neighborhood:\d{3}$/.test(id))
    throw failPublic(400, 'Identificador de bairro inválido.');
  const boundary = await getBoundaryRecord(db, id);
  const aliases = await db
    .select()
    .from(territorialBoundaryAliases)
    .where(
      and(
        eq(territorialBoundaryAliases.sourceId, 'rio1746'),
        eq(territorialBoundaryAliases.boundaryId, id),
      ),
    );
  const trusted = aliases.map((row) => row.externalCode);
  const candidates = [boundary.externalId, String(Number(boundary.externalId))];
  const pairs = await db
    .selectDistinct({
      code: officialCalls.neighborhoodId,
      name: officialCalls.neighborhoodName,
    })
    .from(officialCalls)
    .where(
      and(
        eq(officialCalls.municipalityId, '3304557'),
        inArray(officialCalls.neighborhoodId, candidates),
      ),
    );
  const verified = pairs.filter(
    (pair) =>
      pair.code &&
      pair.name &&
      normalizedName(pair.name) === normalizedName(boundary.name),
  );
  const checks: SQL[] = [
    ...verified.map(
      (pair) =>
        and(
          eq(officialCalls.neighborhoodId, pair.code!),
          eq(officialCalls.neighborhoodName, pair.name!),
        )!,
    ),
  ];
  if (trusted.length)
    checks.push(inArray(officialCalls.neighborhoodId, trusted));
  return {
    confirmed: checks.length > 0,
    where: checks.length
      ? and(eq(officialCalls.municipalityId, '3304557'), or(...checks))!
      : sql`false`,
  };
}

export async function getNeighborhoodOverview(
  db: ReadDatabase,
  id: string,
  startDate: string,
  endDate: string,
): Promise<NeighborhoodOverview> {
  const dates = officialDateConditions(startDate, endDate);
  const boundary = await getBoundaryRecord(db, id);
  const scope = await officialTerritoryScope(db, id);
  const counts = await getFacilityCounts(db, id);
  const sources = await getPublicSources(db);
  const status = await getPublicSyncStatus(db);
  const available = await queryOfficialOverview(db, scope.where);
  const selected = await queryOfficialOverview(db, and(scope.where, ...dates));
  const source = sources.find((source) => source.sourceId === 'rio1746');
  const known = scope.confirmed && source?.state !== 'unavailable';
  return {
    neighborhood: {
      id: boundary.id,
      name: boundary.name,
      municipalityId: boundary.municipalityId,
    },
    facilityCounts: counts,
    sources,
    calls: {
      total: known ? selected.totalCalls : null,
      topServices: known ? selected.topServices : [],
      requestedStart: startDate,
      requestedEnd: endDate,
      availableStart: scope.confirmed
        ? (available.minOpenedAt?.slice(0, 10) ?? null)
        : null,
      availableEnd: scope.confirmed
        ? (available.maxOpenedAt?.slice(0, 10) ?? null)
        : null,
      // A complete partition import does not prove a continuous historical series.
      coverage:
        status?.latestRun?.coverage === 'partial' ? 'partial' : 'unknown',
    },
  };
}
