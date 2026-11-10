import {
  officialDateConditions,
  officialTerritoryScope,
} from './neighborhood-overview.js';
import { parseRadiusFilter, officialRadiusCondition } from './official-call-radius.js';
import { resolveTerritoryLocation } from './territory-location.js';
import { queryOfficialOverview } from './official-call-overview.js';
import { dataVersion, type ResponseCache } from './response-cache.js';
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
  inArray,
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
import {
  isMacroThemeId,
  serviceTypesForTheme,
} from '../../shared/service-themes.js';

const SERVICE_TYPES_TTL_MS = 5 * 60 * 1000;
const serviceTypesCache = new WeakMap<Database, { at: number; types: string[] }>();

/** Tipos distintos do 1746, usados para resolver o filtro de macrotema. */
async function distinctServiceTypes(db: Database): Promise<string[]> {
  const cached = serviceTypesCache.get(db);
  if (cached && Date.now() - cached.at < SERVICE_TYPES_TTL_MS) {
    return cached.types;
  }
  const rows = await db
    .selectDistinct({ type: officialCalls.serviceType })
    .from(officialCalls)
    .where(eq(officialCalls.municipalityId, '3304557'));
  const types = rows.map((r) => r.type).filter(Boolean) as string[];
  serviceTypesCache.set(db, { at: Date.now(), types });
  return types;
}

export function formatOfficialCall(
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

/** Escapa % e _ para o texto digitado casar literalmente num ILIKE. */
export const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

const text = (maxLength: number) => ({ type: 'string', maxLength });
const digits = (max: number) => ({
  type: 'string',
  pattern: `^[0-9]{1,${max}}$`,
});
// Cada parâmetro é um texto simples; repetir o parâmetro (?search=a&search=b) dá 400.
const filterProperties = {
  neighborhoodId: text(100),
  bairro: text(100),
  tipo: text(150),
  tema: text(50),
  situacao: text(100),
  periodDays: digits(3),
  startDate: text(32),
  endDate: text(32),
};
const callsQuerySchema = {
  type: 'object',
  properties: {
    ...filterProperties,
    page: digits(4),
    limit: digits(4),
    cursor: text(2048),
    includeTotal: { type: 'string', enum: ['true', 'false'] },
    subtipo: text(200),
    hasCoordinates: { type: 'string', enum: ['true', 'false'] },
    search: text(100),
    centerLatitude: text(32),
    centerLongitude: text(32),
    radiusMeters: text(16),
    north: text(32),
    south: text(32),
    east: text(32),
    west: text(32),
  },
};
const overviewQuerySchema = { type: 'object', properties: filterProperties };
const MAX_OFFSET_PAGE = 500;

type FilterQuery = {
  neighborhoodId?: string;
  bairro?: string;
  tipo?: string;
  tema?: string;
  situacao?: string;
  periodDays?: string;
  startDate?: string;
  endDate?: string;
};

export function registerOfficialCallsRoutes(
  app: FastifyInstance,
  db: Database,
  pool: pg.Pool,
  ok: (data: unknown) => { success: boolean; data: unknown },
  fail: (statusCode: number, message: string) => Error,
  cache: ResponseCache,
) {
  // Filtros compartilhados pela lista e pelo panorama.
  async function commonConditions(query: FilterQuery) {
    const conditions: SQL[] = [eq(officialCalls.municipalityId, '3304557')];
    if (query.neighborhoodId && query.bairro)
      throw fail(400, 'Use um identificador de bairro ou nome, não ambos.');
    const territory = query.neighborhoodId
      ? await officialTerritoryScope(db, query.neighborhoodId)
      : { confirmed: true, where: undefined };
    if (territory.where) conditions.push(territory.where);
    if (query.bairro)
      conditions.push(
        ilike(officialCalls.neighborhoodName, escapeLike(query.bairro.trim())),
      );
    if (query.tipo)
      conditions.push(eq(officialCalls.serviceType, query.tipo.trim()));
    if (query.tema) {
      const tema = query.tema.trim();
      if (!isMacroThemeId(tema)) throw fail(400, 'Tema de serviço inválido.');
      const types = serviceTypesForTheme(await distinctServiceTypes(db), tema);
      conditions.push(
        types.length > 0 ? inArray(officialCalls.serviceType, types) : sql`false`,
      );
    }
    if (query.situacao)
      conditions.push(
        eq(officialCalls.officialSituation, query.situacao.trim()),
      );
    const periodCondition =
      query.startDate || query.endDate
        ? undefined
        : buildPeriodCondition(query.periodDays);
    if (periodCondition) conditions.push(periodCondition);
    conditions.push(...officialDateConditions(query.startDate, query.endDate));
    return { conditions, territory };
  }

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
      tema?: string;
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
  }>('/api/rio1746/calls', { schema: { querystring: callsQuerySchema } }, async (req) => {
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
    if (page > MAX_OFFSET_PAGE)
      throw fail(400, 'Use o cursor para continuar a lista.');
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

    const { conditions, territory } = await commonConditions(req.query);
    if (radius) conditions.push(officialRadiusCondition(radius));
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

    if (req.query.search) {
      const term = `%${escapeLike(req.query.search.trim())}%`;
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
    const version = await dataVersion(db);
    return cache.get('filters', version, () => loadFilters());
  });
  async function loadFilters() {
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
  }

  // 4. Aggregated territorial overview and SLA/outcome indicators
  app.get<{
    Querystring: {
      neighborhoodId?: string;
      bairro?: string;
      tipo?: string;
      tema?: string;
      situacao?: string;
      periodDays?: string;
      startDate?: string;
      endDate?: string;
    };
  }>('/api/rio1746/overview', { schema: { querystring: overviewQuerySchema } }, async (req) => {
    const version = await dataVersion(db);
    return cache.get(`overview:${JSON.stringify(req.query)}`, version, async () => {
      const { conditions, territory } = await commonConditions(req.query);
      const whereClause = and(...conditions);

      return ok({
        ...(await queryOfficialOverview(db, whereClause)),
        territoryConfirmed: territory.confirmed,
      });
    });
  });

  // 5. Check sync status
  app.get('/api/rio1746/sync-status', async () => {
    const status = await getPublicSyncStatus(db);
    return ok(status);
  });

}
