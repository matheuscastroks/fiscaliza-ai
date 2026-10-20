import type { FastifyInstance } from 'fastify';
import { and, desc, eq, gte, ilike, isNotNull, lte, or, sql, type SQL } from 'drizzle-orm';
import type { Database } from './db.js';
import type pg from 'pg';
import { officialCalls } from './schema.js';
import {
  runRio1746RangeSync,
  runRio1746Sync,
  getSyncStatus,
  getPublicSyncStatus,
} from './integrations/rio1746/sync.js';
import type {
  OfficialCall,
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
      limit?: string;
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
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit || '100', 10) || 100));
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (req.query.bairro) {
      conditions.push(ilike(officialCalls.neighborhoodName, req.query.bairro.trim()));
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

    const periodCondition = buildPeriodCondition(req.query.periodDays);
    if (periodCondition) {
      conditions.push(periodCondition);
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

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(officialCalls)
      .where(whereClause);

    const total = countResult?.count || 0;

    const rows = await db
      .select()
      .from(officialCalls)
      .where(whereClause)
      .orderBy(desc(officialCalls.openedAt), desc(officialCalls.externalId))
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

  // 4. Aggregated territorial overview and SLA/outcome indicators
  app.get<{
    Querystring: {
      bairro?: string;
      tipo?: string;
      situacao?: string;
      periodDays?: string;
    };
  }>('/api/rio1746/overview', async (req) => {
    const conditions: SQL[] = [];
    if (req.query.bairro) {
      conditions.push(ilike(officialCalls.neighborhoodName, req.query.bairro.trim()));
    }
    if (req.query.tipo) {
      conditions.push(eq(officialCalls.serviceType, req.query.tipo.trim()));
    }
    if (req.query.situacao) {
      conditions.push(eq(officialCalls.officialSituation, req.query.situacao.trim()));
    }
    const periodCondition = buildPeriodCondition(req.query.periodDays);
    if (periodCondition) {
      conditions.push(periodCondition);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [counts] = await db
      .select({
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(case when ${officialCalls.officialSituation} = 'Não Encerrado' then 1 end)::int`,
        closed: sql<number>`count(case when ${officialCalls.officialSituation} = 'Encerrado' then 1 end)::int`,
        withCoords: sql<number>`count(case when ${officialCalls.latitude} is not null then 1 end)::int`,
        withinDeadline: sql<number>`count(case when ${officialCalls.withinDeadline} in ('No Prazo', 'A Vencer (No Prazo)') then 1 end)::int`,
        overdue: sql<number>`count(case when ${officialCalls.withinDeadline} = 'Fora do Prazo' then 1 end)::int`,
        minOpenedAt: sql<string>`min(${officialCalls.openedAt})::text`,
        maxOpenedAt: sql<string>`max(${officialCalls.openedAt})::text`,
        latestPartition: sql<string>`max(${officialCalls.sourcePartitionDate})::text`,
      })
      .from(officialCalls)
      .where(whereClause);

    const [topServices, topNeighborhoods, situationBreakdown, statusBreakdown, checkpoint] =
      await Promise.all([
        db
          .select({
            type: officialCalls.serviceType,
            count: sql<number>`count(*)::int`,
          })
          .from(officialCalls)
          .where(whereClause)
          .groupBy(officialCalls.serviceType)
          .orderBy(desc(sql`count(*)`))
          .limit(10),
        db
          .select({
            neighborhood: officialCalls.neighborhoodName,
            count: sql<number>`count(*)::int`,
          })
          .from(officialCalls)
          .where(
            whereClause
              ? and(isNotNull(officialCalls.neighborhoodName), whereClause)
              : isNotNull(officialCalls.neighborhoodName),
          )
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
            whereClause
              ? and(isNotNull(officialCalls.officialSituation), whereClause)
              : isNotNull(officialCalls.officialSituation),
          )
          .groupBy(officialCalls.officialSituation)
          .orderBy(desc(sql`count(*)`)),
        db
          .select({
            status: officialCalls.officialStatus,
            count: sql<number>`count(*)::int`,
          })
          .from(officialCalls)
          .where(
            whereClause
              ? and(isNotNull(officialCalls.officialStatus), whereClause)
              : isNotNull(officialCalls.officialStatus),
          )
          .groupBy(officialCalls.officialStatus)
          .orderBy(desc(sql`count(*)`))
          .limit(8),
        getSyncStatus(db),
      ]);

    const withinDeadlineCount = counts?.withinDeadline || 0;
    const overdueCount = counts?.overdue || 0;
    const slaDenominator = withinDeadlineCount + overdueCount;
    const withinDeadlineRate =
      slaDenominator > 0 ? Math.round((withinDeadlineCount / slaDenominator) * 100) : 0;

    return ok({
      totalCalls: counts?.total || 0,
      openCalls: counts?.open || 0,
      closedCalls: counts?.closed || 0,
      callsWithCoordinates: counts?.withCoords || 0,
      withinDeadlineCount,
      overdueCount,
      withinDeadlineRate,
      topServices: topServices.map((s) => ({ type: s.type, count: s.count })),
      topNeighborhoods: topNeighborhoods.map((n) => ({
        neighborhood: n.neighborhood || 'Desconhecido',
        count: n.count,
      })),
      situationBreakdown: situationBreakdown.map((sb) => ({
        situation: sb.situation || 'Não informada',
        count: sb.count,
      })),
      statusBreakdown: statusBreakdown.map((st) => ({
        status: st.status || 'Não informado',
        count: st.count,
      })),
      minOpenedAt: counts?.minOpenedAt || null,
      maxOpenedAt: counts?.maxOpenedAt || null,
      lastPartitionDate: counts?.latestPartition || checkpoint?.lastPartition || null,
      lastSyncedAt: checkpoint?.lastSyncedAt ? checkpoint.lastSyncedAt.toISOString() : null,
    });
  });

  // 5. Check sync status
  app.get('/api/rio1746/sync-status', async () => {
    const status = await getPublicSyncStatus(db);
    return ok(status);
  });

  // 6. Trigger manual / scheduled sync (restricted to admin role)
  app.post<{
    Body?: {
      partitionDate?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    };
  }>(
    '/api/rio1746/sync',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          oneOf: [
            {
              required: ['partitionDate'],
              not: {
                anyOf: [{ required: ['startDate'] }, { required: ['endDate'] }],
              },
            },
            {
              required: ['startDate', 'endDate'],
              not: { required: ['partitionDate'] },
            },
          ],
          properties: {
            partitionDate: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            },
            startDate: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            },
            endDate: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            },
            limit: {
              type: 'integer',
              minimum: 10,
              maximum: 50000,
            },
          },
        },
      },
    },
    async (req) => {
      if (!req.user || req.user.role !== 'admin') {
        throw fail(403, 'Acesso restrito à administração.');
      }
      if (!req.body)
        throw fail(400, 'Informe uma data ou intervalo para sincronizar.');

      const maxRecords = req.body?.limit
        ? Math.min(50000, Math.max(10, req.body.limit))
        : undefined;

      if (req.body?.startDate && req.body?.endDate) {
        const rangeResult = await runRio1746RangeSync(
          db,
          pool,
          req.body.startDate,
          req.body.endDate,
          maxRecords ? { maxRecords } : {},
        );
        return ok(rangeResult);
      }

      const partition = req.body.partitionDate!;
      const result = await runRio1746Sync(
        db,
        pool,
        partition,
        maxRecords ? { maxRecords } : {},
      );
      return ok(result);
    },
  );
}
