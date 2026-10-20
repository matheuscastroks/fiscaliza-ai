import type { FastifyInstance } from 'fastify';
import { and, desc, eq, gte, ilike, isNotNull, lte, or, sql } from 'drizzle-orm';
import type { Database } from './db.js';
import { officialCalls } from './schema.js';
import { runRio1746Sync, getSyncStatus } from './integrations/rio1746/sync.js';
import type {
  OfficialCall,
  OfficialCallsFilterOptions,
  OfficialCallsOverview,
} from '../../shared/contracts.js';

function formatOfficialCall(row: typeof officialCalls.$inferSelect): OfficialCall {
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
    withinDeadline: row.withinDeadline,
    timeRemaining: row.timeRemaining,
    timeUnit: row.timeUnit,
    neighborhoodId: row.neighborhoodId,
    neighborhoodName: row.neighborhoodName,
    subprefecture: row.subprefecture,
    latitude: row.latitude,
    longitude: row.longitude,
    sourcePartitionDate: row.sourcePartitionDate ? String(row.sourcePartitionDate) : null,
    importedAt: row.importedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function registerOfficialCallsRoutes(
  app: FastifyInstance,
  db: Database,
  ok: (data: unknown) => { success: boolean; data: unknown },
  fail: (statusCode: number, message: string) => Error,
) {
  // 1. List calls with rich filtering and pagination
  app.get<{
    Querystring: {
      page?: string;
      limit?: string;
      bairro?: string;
      tipo?: string;
      subtipo?: string;
      situacao?: string;
      hasCoordinates?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
      north?: string;
      south?: string;
      east?: string;
      west?: string;
    };
  }>('/api/rio1746/calls', async (req) => {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit || '100', 10) || 100));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (req.query.bairro) {
      conditions.push(ilike(officialCalls.neighborhoodName, `%${req.query.bairro.trim()}%`));
    }
    if (req.query.tipo) {
      conditions.push(eq(officialCalls.serviceType, req.query.tipo.trim()));
    }
    if (req.query.subtipo) {
      conditions.push(eq(officialCalls.serviceSubtype, req.query.subtipo.trim()));
    }
    if (req.query.situacao) {
      conditions.push(eq(officialCalls.officialSituation, req.query.situacao.trim()));
    }
    if (req.query.hasCoordinates === 'true') {
      conditions.push(isNotNull(officialCalls.latitude));
      conditions.push(isNotNull(officialCalls.longitude));
    }
    if (req.query.startDate) {
      try {
        const start = new Date(req.query.startDate);
        if (!isNaN(start.getTime())) {
          conditions.push(gte(officialCalls.openedAt, start));
        }
      } catch {}
    }
    if (req.query.endDate) {
      try {
        const end = new Date(req.query.endDate);
        if (!isNaN(end.getTime())) {
          conditions.push(lte(officialCalls.openedAt, end));
        }
      } catch {}
    }
    if (req.query.search) {
      const term = `%${req.query.search.trim()}%`;
      conditions.push(
        or(
          ilike(officialCalls.serviceType, term),
          ilike(officialCalls.serviceSubtype, term),
          ilike(officialCalls.neighborhoodName, term),
          ilike(officialCalls.organizationName, term),
          ilike(officialCalls.statusJustification, term),
          ilike(officialCalls.externalId, term),
        ),
      );
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
      conditions.push(
        and(
          gte(officialCalls.latitude, south),
          lte(officialCalls.latitude, north),
          gte(officialCalls.longitude, west),
          lte(officialCalls.longitude, east),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(officialCalls)
      .where(whereClause);

    const total = countResult?.count || 0;

    const rows = await db
      .select()
      .from(officialCalls)
      .where(whereClause)
      .orderBy(desc(officialCalls.openedAt))
      .limit(limit)
      .offset(offset);

    return ok({
      calls: rows.map(formatOfficialCall),
      total,
      page,
      limit,
      hasMore: offset + rows.length < total,
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
    const [bairrosResult, tiposResult, subtiposResult, situacoesResult] = await Promise.all([
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
      subtipos: subtiposResult.map((r) => r.subtype).filter(Boolean) as string[],
      situacoes: situacoesResult.map((r) => r.situation).filter(Boolean) as string[],
    });
  });

  // 4. Aggregated territorial overview and indicators
  app.get<{ Querystring: { bairro?: string } }>('/api/rio1746/overview', async (req) => {
    const bairroCondition = req.query.bairro
      ? ilike(officialCalls.neighborhoodName, `%${req.query.bairro.trim()}%`)
      : undefined;

    const [counts] = await db
      .select({
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(case when ${officialCalls.officialSituation} = 'Não Encerrado' then 1 end)::int`,
        closed: sql<number>`count(case when ${officialCalls.officialSituation} = 'Encerrado' then 1 end)::int`,
        withCoords: sql<number>`count(case when ${officialCalls.latitude} is not null then 1 end)::int`,
        latestPartition: sql<string>`max(${officialCalls.sourcePartitionDate})::text`,
      })
      .from(officialCalls)
      .where(bairroCondition);

    const [topServices, topNeighborhoods, situationBreakdown, checkpoint] = await Promise.all([
      db
        .select({
          type: officialCalls.serviceType,
          count: sql<number>`count(*)::int`,
        })
        .from(officialCalls)
        .where(bairroCondition)
        .groupBy(officialCalls.serviceType)
        .orderBy(desc(sql`count(*)`))
        .limit(10),
      db
        .select({
          neighborhood: officialCalls.neighborhoodName,
          count: sql<number>`count(*)::int`,
        })
        .from(officialCalls)
        .where(isNotNull(officialCalls.neighborhoodName))
        .groupBy(officialCalls.neighborhoodName)
        .orderBy(desc(sql`count(*)`))
        .limit(10),
      db
        .select({
          situation: officialCalls.officialSituation,
          count: sql<number>`count(*)::int`,
        })
        .from(officialCalls)
        .where(
          bairroCondition
            ? and(isNotNull(officialCalls.officialSituation), bairroCondition)
            : isNotNull(officialCalls.officialSituation),
        )
        .groupBy(officialCalls.officialSituation)
        .orderBy(desc(sql`count(*)`)),
      getSyncStatus(db),
    ]);

    return ok({
      totalCalls: counts?.total || 0,
      openCalls: counts?.open || 0,
      closedCalls: counts?.closed || 0,
      callsWithCoordinates: counts?.withCoords || 0,
      topServices: topServices.map((s) => ({ type: s.type, count: s.count })),
      topNeighborhoods: topNeighborhoods.map((n) => ({
        neighborhood: n.neighborhood || 'Desconhecido',
        count: n.count,
      })),
      situationBreakdown: situationBreakdown.map((sb) => ({
        situation: sb.situation || 'Não informada',
        count: sb.count,
      })),
      lastPartitionDate: counts?.latestPartition || null,
      lastSyncedAt: checkpoint?.lastSyncedAt ? checkpoint.lastSyncedAt.toISOString() : null,
    });
  });

  // 5. Check sync status
  app.get('/api/rio1746/sync-status', async () => {
    const status = await getSyncStatus(db);
    return ok(status);
  });

  // 6. Trigger manual / scheduled sync
  app.post<{
    Body?: {
      partitionDate?: string;
      limit?: number;
    };
  }>('/api/rio1746/sync', async (req) => {
    const partition = req.body?.partitionDate || '2026-09-20';
    const limit = Math.min(5000, Math.max(10, req.body?.limit || 2000));

    const result = await runRio1746Sync(db, partition, limit);
    return ok(result);
  });
}
