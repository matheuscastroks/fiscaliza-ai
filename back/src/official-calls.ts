import {
  officialDateConditions,
  officialTerritoryScope,
} from './neighborhood-overview.js';
import { parseRadiusFilter, officialRadiusCondition } from './official-call-radius.js';
import { resolveTerritoryLocation } from './territory-location.js';
import { queryOfficialOverview } from './official-call-overview.js';
import {
  callCursorScope,
  decodeCallCursor,
  encodeCallCursor,
} from './official-call-pagination.js';
import type { FastifyInstance } from 'fastify';
import {
  and,
  desc,
  eq,
  gte,
  getTableColumns,
  ilike,
  isNotNull,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import type { Database } from './db.js';
import type pg from 'pg';
import { officialCalls } from './schema.js';
import {
  getPublicSyncStatus,
} from './integrations/rio1746/sync.js';
import type { OfficialCall } from '../../shared/contracts.js';

function formatOfficialCall(
  row: typeof officialCalls.$inferSelect,
): OfficialCall {
  return {
    id: row.id,
    externalId: row.externalId,
    source: 'rio1746',
    municipalityId: row.municipalityId,
    serviceCategory: row.serviceCategory,
    serviceType: row.serviceType,
    serviceSubtype: row.serviceSubtype,
    organizationName: row.organizationName,
    officialStatus: row.officialStatus,
    officialSituation: row.officialSituation,
    officialSituationType: row.officialSituationType,
    statusJustification: row.statusJustification,
    openedAt: row.openedAt.toISOString(),
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
    targetDate: row.targetDate ? row.targetDate.toISOString() : null,
    diagnosisTargetDate: row.diagnosisTargetDate
      ? row.diagnosisTargetDate.toISOString()
      : null,
    withinDeadline: row.withinDeadline,
    timeRemaining: row.timeRemaining,
    timeUnit: row.timeUnit,
    deadlineType: row.deadlineType,
    complaintsCount: row.complaintsCount,
    streetName: row.streetName,
    neighborhoodId: row.neighborhoodId,
    neighborhoodName: row.neighborhoodName,
    subprefecture: row.subprefecture,
    latitude: row.latitude,
    longitude: row.longitude,
    sourcePartitionDate: row.sourcePartitionDate
      ? String(row.sourcePartitionDate)
      : null,
    importedAt: row.importedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildPeriodCondition(periodDaysRaw?: string): SQL | undefined {
  if (!periodDaysRaw) return undefined;
  const periodDays = parseInt(periodDaysRaw, 10);
  if (!Number.isInteger(periodDays) || periodDays < 1 || periodDays > 365) {
    return undefined;
  }
  return sql`${officialCalls.openedAt} >= (SELECT MAX(opened_at) - (${periodDays} * INTERVAL '1 day') FROM official_calls)`;
}

export function registerOfficialCallsRoutes(
  app: FastifyInstance,
  db: Database,
  pool: pg.Pool,
  ok: (data: unknown) => { success: boolean; data: unknown },
  fail: (statusCode: number, message: string) => Error,
) {
  // 1. List calls with rich filtering, visible map area bounding box, period, and pagination
  app.get<{
    Querystring: {
      page?: string;
      centerLatitude?: string;
      centerLongitude?: string;
      radiusMeters?: string;
      cursor?: string;
      includeTotal?: string;
      limit?: string;
      neighborhoodId?: string;
      bairro?: string;
      tipo?: string;
      subtipo?: string;
      situacao?: string;
      hasCoordinates?: string;
      search?: string;
      periodDays?: string;
      startDate?: string;
      endDate?: string;
      north?: string;
      south?: string;
      east?: string;
      west?: string;
    };
  }>('/api/rio1746/calls', async (req) => {
    const radius = parseRadiusFilter(req.query);
    if (radius) {
      const location = await resolveTerritoryLocation(db, { latitude: radius.centerLatitude, longitude: radius.centerLongitude });
      if (!location.insideMunicipality) throw fail(422, 'Escolha um ponto dentro do Rio de Janeiro.');
    }
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(
      1000,
      Math.max(1, parseInt(req.query.limit || '100', 10) || 100),
    );
    const offset = (page - 1) * limit;
    if (req.query.cursor && page !== 1)
      throw fail(400, 'Use cursor ou página, não ambos.');
    const scope = callCursorScope(req.query);
    let cursor: { date: string; id: string } | undefined;
    if (req.query.cursor) {
      try {
        cursor = decodeCallCursor(req.query.cursor, scope);
      } catch {
        throw fail(400, 'Cursor inválido ou incompatível com os filtros.');
      }
    }

    const conditions: SQL[] = [eq(officialCalls.municipalityId, '3304557')];
    if (radius) conditions.push(officialRadiusCondition(radius));
    if (req.query.neighborhoodId && req.query.bairro)
      throw fail(400, 'Use um identificador de bairro ou nome, não ambos.');
    const territory = req.query.neighborhoodId
      ? await officialTerritoryScope(db, req.query.neighborhoodId)
      : { confirmed: true, where: undefined };
    if (territory.where) conditions.push(territory.where);

    if (req.query.bairro) {
      conditions.push(
        ilike(officialCalls.neighborhoodName, req.query.bairro.trim()),
      );
    }
    if (req.query.tipo) {
      conditions.push(eq(officialCalls.serviceType, req.query.tipo.trim()));
    }
    if (req.query.subtipo) {
      conditions.push(
        eq(officialCalls.serviceSubtype, req.query.subtipo.trim()),
      );
    }
    if (req.query.situacao) {
      conditions.push(
        eq(officialCalls.officialSituation, req.query.situacao.trim()),
      );
    }
    if (req.query.hasCoordinates === 'true') {
      conditions.push(isNotNull(officialCalls.latitude));
      conditions.push(isNotNull(officialCalls.longitude));
    }

    const periodCondition =
      req.query.startDate || req.query.endDate
        ? undefined
        : buildPeriodCondition(req.query.periodDays);
    if (periodCondition) {
      conditions.push(periodCondition);
    }

    conditions.push(
      ...officialDateConditions(req.query.startDate, req.query.endDate),
    );
    if (req.query.search) {
      const term = `%${req.query.search.trim()}%`;
      const searchCond = or(
        ilike(officialCalls.serviceType, term),
        ilike(officialCalls.serviceSubtype, term),
        ilike(officialCalls.neighborhoodName, term),
        ilike(officialCalls.organizationName, term),
        ilike(officialCalls.statusJustification, term),
        ilike(officialCalls.externalId, term),
      );
      if (searchCond) conditions.push(searchCond);
    }

    // Spatial bounding box filter if coordinates passed
    const north = parseFloat(req.query.north || '');
    const south = parseFloat(req.query.south || '');
    const east = parseFloat(req.query.east || '');
    const west = parseFloat(req.query.west || '');
    if (
      Number.isFinite(north) &&
      Number.isFinite(south) &&
      Number.isFinite(east) &&
      Number.isFinite(west)
    ) {
      const bboxCond = and(
        gte(officialCalls.latitude, Math.min(south, north)),
        lte(officialCalls.latitude, Math.max(south, north)),
        gte(officialCalls.longitude, Math.min(west, east)),
        lte(officialCalls.longitude, Math.max(west, east)),
      );
      if (bboxCond) conditions.push(bboxCond);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Continuations need only one look-ahead row, not another full COUNT.
    const total =
      req.query.includeTotal === 'false'
        ? null
        : ((
            await db
              .select({ count: sql<number>`count(*)::int` })
              .from(officialCalls)
              .where(whereClause)
          )[0]?.count ?? 0);
    const pageWhere = cursor
      ? and(
          whereClause,
          sql`(${officialCalls.openedAt}, ${officialCalls.externalId}) < (${cursor.date}::timestamptz, ${cursor.id})`,
        )
      : whereClause;

    const rows = await db
      .select({
        ...getTableColumns(officialCalls),
        cursorDate: sql<string>`to_char(${officialCalls.openedAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
      })
      .from(officialCalls)
      .where(pageWhere)
      .orderBy(desc(officialCalls.openedAt), desc(officialCalls.externalId))
      .limit(limit + 1)
      .offset(offset);
    const hasMore = rows.length > limit;
    const visibleRows = rows.slice(0, limit);
    const last = visibleRows.at(-1);

    return ok({
      territoryConfirmed: territory.confirmed,
      calls: visibleRows.map(formatOfficialCall),
      total,
      page,
      limit,
      hasMore,
      nextCursor:
        hasMore && last
          ? encodeCallCursor(last.cursorDate, last.externalId, scope)
          : null,
    });
  });

  // 2. Details of single official call
  app.get<{ Params: { id: string } }>('/api/rio1746/calls/:id', async (req) => {
    const paramId = req.params.id;
    const isPrefixed = paramId.startsWith('rio1746-');
    const externalId = isPrefixed ? paramId.replace('rio1746-', '') : paramId;

    const rows = await db
      .select()
      .from(officialCalls)
      .where(
        or(
          eq(officialCalls.id, paramId),
          eq(officialCalls.externalId, externalId),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      throw fail(404, 'Chamado oficial 1746 não encontrado.');
    }

    return ok(formatOfficialCall(rows[0]));
  });

  // 3. Filter options available in the current database
  app.get('/api/rio1746/filters', async () => {
    const [bairrosResult, tiposResult, subtiposResult, situacoesResult] =
      await Promise.all([
        db
          .selectDistinct({ name: officialCalls.neighborhoodName })
          .from(officialCalls)
          .where(isNotNull(officialCalls.neighborhoodName))
          .orderBy(officialCalls.neighborhoodName),
        db
          .selectDistinct({ type: officialCalls.serviceType })
          .from(officialCalls)
          .orderBy(officialCalls.serviceType),
        db
          .selectDistinct({ subtype: officialCalls.serviceSubtype })
          .from(officialCalls)
          .orderBy(officialCalls.serviceSubtype),
        db
          .selectDistinct({ situation: officialCalls.officialSituation })
          .from(officialCalls)
          .where(isNotNull(officialCalls.officialSituation))
          .orderBy(officialCalls.officialSituation),
      ]);

    return ok({
      bairros: bairrosResult.map((r) => r.name).filter(Boolean) as string[],
      tipos: tiposResult.map((r) => r.type).filter(Boolean) as string[],
      subtipos: subtiposResult
        .map((r) => r.subtype)
        .filter(Boolean) as string[],
      situacoes: situacoesResult
        .map((r) => r.situation)
        .filter(Boolean) as string[],
    });
  });

  // 4. Aggregated territorial overview and SLA/outcome indicators
  app.get<{
    Querystring: {
      neighborhoodId?: string;
      bairro?: string;
      tipo?: string;
      situacao?: string;
      periodDays?: string;
      startDate?: string;
      endDate?: string;
    };
  }>('/api/rio1746/overview', async (req) => {
    const conditions: SQL[] = [eq(officialCalls.municipalityId, '3304557')];
    if (req.query.neighborhoodId && req.query.bairro)
      throw fail(400, 'Use um identificador de bairro ou nome, não ambos.');
    const territory = req.query.neighborhoodId
      ? await officialTerritoryScope(db, req.query.neighborhoodId)
      : { confirmed: true, where: undefined };
    if (territory.where) conditions.push(territory.where);
    if (req.query.bairro) {
      conditions.push(
        ilike(officialCalls.neighborhoodName, req.query.bairro.trim()),
      );
    }
    if (req.query.tipo) {
      conditions.push(eq(officialCalls.serviceType, req.query.tipo.trim()));
    }
    if (req.query.situacao) {
      conditions.push(
        eq(officialCalls.officialSituation, req.query.situacao.trim()),
      );
    }
    const periodCondition =
      req.query.startDate || req.query.endDate
        ? undefined
        : buildPeriodCondition(req.query.periodDays);
    if (periodCondition) {
      conditions.push(periodCondition);
    }

    conditions.push(
      ...officialDateConditions(req.query.startDate, req.query.endDate),
    );
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return ok({
      ...(await queryOfficialOverview(db, whereClause)),
      territoryConfirmed: territory.confirmed,
    });
  });

  // 5. Check sync status
  app.get('/api/rio1746/sync-status', async () => {
    const status = await getPublicSyncStatus(db);
    return ok(status);
  });

}
