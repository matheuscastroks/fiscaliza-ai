import { and, asc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import type { ReadDatabase } from './db.js';
import {
  dataSources,
  publicFacilities,
  territorialBoundaries,
} from './territorial-schema.js';
import { officialCalls } from './schema.js';
import { getPublicSyncStatus } from './integrations/rio1746/sync.js';
import {
  getSiurbLayer,
  SIURB_LAYER_IDS,
} from './integrations/siurb/catalog.js';
import type {
  FacilityCategory,
  FacilitiesPage,
  FacilitiesQuery,
  NeighborhoodBoundary,
  PublicFacility,
  PublicFacilitySummary,
  PublicSource,
} from '../../shared/contracts.js';
export const failPublic = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode });
export const CATEGORY_SOURCES: Record<FacilityCategory, string> = {
  school: 'siurb-schools',
  health: 'siurb-health',
  square: 'siurb-squares',
};
const labels = {
  school: 'Escolas municipais',
  health: 'Unidades de saúde',
  square: 'Praças e espaços públicos',
  boundary: 'Limites de bairros',
};
export const publishedSource = () =>
  and(
    eq(dataSources.usage, 'individual'),
    inArray(dataSources.state, ['available', 'stale']),
    eq(dataSources.coverage, 'complete'),
  );
export async function getSiurbSources(
  db: ReadDatabase,
): Promise<PublicSource[]> {
  const rows = await db
    .select()
    .from(dataSources)
    .where(
      inArray(
        dataSources.id,
        SIURB_LAYER_IDS.map((id) => getSiurbLayer(id).sourceId),
      ),
    );
  return SIURB_LAYER_IDS.map((id): PublicSource => {
    const layer = getSiurbLayer(id),
      row = rows.find((row) => row.id === layer.sourceId);
    if (!row)
      return {
        sourceId: layer.sourceId,
        publicationId: null,
        name: labels[layer.category],
        provider: 'Instituto Pereira Passos / PCRJ',
        officialUrl: layer.url,
        attribution: layer.attribution,
        usage: layer.usage,
        usageEvidenceUrl: layer.usageEvidenceUrl,
        state: 'unavailable',
        coverage: 'unknown',
        publishedAt: null,
        sourceUpdatedAt: null,
        referenceDate: null,
        unresolvedCount: null,
      };
    const state =
      row.usage !== 'individual'
        ? 'restricted'
        : !row.publishedRunId
          ? 'unavailable'
          : row.state;
    const unresolved = row.details.unresolved;
    return {
      sourceId: row.id,
      publicationId: row.publishedRunId,
      name: row.name,
      provider: row.provider,
      officialUrl: row.officialUrl,
      attribution: row.attribution,
      usage: row.usage,
      usageEvidenceUrl: row.usageEvidenceUrl,
      state,
      coverage: row.publishedRunId ? row.coverage : 'unknown',
      publishedAt: row.publishedRunId
        ? (row.publishedAt?.toISOString() ?? null)
        : null,
      sourceUpdatedAt: row.sourceUpdatedAt?.toISOString() ?? null,
      referenceDate: row.referenceDate,
      unresolvedCount:
        typeof unresolved === 'number' &&
        Number.isSafeInteger(unresolved) &&
        state !== 'restricted'
          ? unresolved
          : null,
    };
  });
}
export async function getPublicSources(
  db: ReadDatabase,
): Promise<PublicSource[]> {
  const sources = await getSiurbSources(db);
  const status = await getPublicSyncStatus(db);
  const [any] = await db
    .select({ id: officialCalls.id })
    .from(officialCalls)
    .where(eq(officialCalls.municipalityId, '3304557'))
    .limit(1);
  return [
    ...sources,
    {
      sourceId: 'rio1746',
      publicationId: null,
      name: 'Central 1746',
      provider: 'Prefeitura da Cidade do Rio de Janeiro / DATA.RIO',
      officialUrl: 'https://www.data.rio/',
      attribution: 'Prefeitura da Cidade do Rio de Janeiro',
      usage: 'individual',
      usageEvidenceUrl: null,
      state:
        any || status?.lastSyncAt
          ? status?.latestRun?.status === 'failed'
            ? 'stale'
            : 'available'
          : 'unavailable',
      coverage: status?.latestRun?.coverage ?? 'unknown',
      referenceDate: status?.lastPartitionDate ?? null,
      publishedAt: status?.lastSyncAt ?? null,
      sourceUpdatedAt: null,
      unresolvedCount: null,
    },
  ];
}
export const activeFacilities = () =>
  and(
    eq(publicFacilities.municipalityId, '3304557'),
    eq(dataSources.id, publicFacilities.sourceId),
    eq(dataSources.publishedRunId, publicFacilities.lastSeenRunId),
    publishedSource(),
  );
export const activeBoundaries = () =>
  and(
    eq(territorialBoundaries.municipalityId, '3304557'),
    eq(dataSources.id, territorialBoundaries.sourceId),
    eq(dataSources.publishedRunId, territorialBoundaries.lastSeenRunId),
    publishedSource(),
  );
export async function listPublicBoundaries(db: ReadDatabase) {
  return db
    .select({
      id: territorialBoundaries.id,
      name: territorialBoundaries.name,
      municipalityId: territorialBoundaries.municipalityId,
    })
    .from(territorialBoundaries)
    .innerJoin(dataSources, eq(dataSources.id, territorialBoundaries.sourceId))
    .where(activeBoundaries())
    .orderBy(asc(territorialBoundaries.name), asc(territorialBoundaries.id));
}
export async function getBoundaryRecord(db: ReadDatabase, id: string) {
  const [row] = await db
    .select({
      id: territorialBoundaries.id,
      name: territorialBoundaries.name,
      municipalityId: territorialBoundaries.municipalityId,
      sourceId: territorialBoundaries.sourceId,
      externalId: territorialBoundaries.externalId,
      geometry: territorialBoundaries.geometry,
    })
    .from(territorialBoundaries)
    .innerJoin(dataSources, eq(dataSources.id, territorialBoundaries.sourceId))
    .where(and(activeBoundaries(), eq(territorialBoundaries.id, id)))
    .limit(1);
  if (!row) throw failPublic(404, 'Bairro não encontrado na base publicada.');
  return row;
}
export async function getPublicBoundary(
  db: ReadDatabase,
  id: string,
): Promise<NeighborhoodBoundary> {
  const row = await getBoundaryRecord(db, id);
  const source = (await getSiurbSources(db)).find(
    (s) => s.sourceId === row.sourceId,
  )!;
  return {
    id: row.id,
    name: row.name,
    municipalityId: row.municipalityId,
    geometry: row.geometry,
    provenance: source,
  };
}
const facilityProjection = {
  id: publicFacilities.id,
  externalId: publicFacilities.externalId,
  sourceId: publicFacilities.sourceId,
  category: publicFacilities.category,
  name: publicFacilities.name,
  address: publicFacilities.address,
  phone: publicFacilities.phone,
  openingHours: publicFacilities.openingHours,
  activity: publicFacilities.activity,
  facilityType: publicFacilities.facilityType,
  neighborhoodId: publicFacilities.neighborhoodId,
  neighborhoodName: publicFacilities.neighborhoodName,
  latitude: publicFacilities.latitude,
  longitude: publicFacilities.longitude,
  geometryType: sql<string | null>`${publicFacilities.geometry}->>'type'`,
};
type FacilityRow = {
  id: string;
  externalId: string;
  sourceId: string;
  category: FacilityCategory;
  name: string | null;
  address: string | null;
  phone: string | null;
  openingHours: string | null;
  activity: string | null;
  facilityType: string | null;
  neighborhoodId: string | null;
  neighborhoodName: string | null;
  latitude: number | null;
  longitude: number | null;
  geometryType: string | null;
};
function presentFacility(
  row: FacilityRow,
  source: PublicSource,
): PublicFacilitySummary {
  const { latitude, longitude, geometryType, ...fields } = row;
  return {
    ...fields,
    location:
      latitude != null && longitude != null ? { latitude, longitude } : null,
    locationDerived:
      geometryType !== null && geometryType !== 'Point' && latitude != null,
    provenance: source,
  };
}
export async function listPublicFacilities(
  db: ReadDatabase,
  params: FacilitiesQuery = {},
): Promise<FacilitiesPage> {
  const categories = params.categories?.length
    ? params.categories
    : (['school', 'health', 'square'] as FacilityCategory[]);
  const sourceIds = categories.map((category) => CATEGORY_SOURCES[category]);
  const sources = (await getSiurbSources(db)).filter((source) =>
    sourceIds.includes(source.sourceId),
  );
  const conditions: SQL[] = [
    activeFacilities()!,
    inArray(publicFacilities.sourceId, sourceIds),
  ];
  if (params.neighborhoodId) {
    try {
      await getBoundaryRecord(db, params.neighborhoodId);
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404)
        throw failPublic(400, 'Filtro de bairro inválido.');
      throw error;
    }
    conditions.push(eq(publicFacilities.neighborhoodId, params.neighborhoodId));
  }
  if (params.search?.trim()) {
    const term = '%' + params.search.trim().replace(/[\\%_]/g, '\\$&') + '%';
    conditions.push(
      or(
        ilike(publicFacilities.name, term),
        ilike(publicFacilities.address, term),
        ilike(publicFacilities.facilityType, term),
      )!,
    );
  }
  if (params.north !== undefined) {
    if (
      params.south === undefined ||
      params.east === undefined ||
      params.west === undefined ||
      params.north < params.south ||
      params.east < params.west
    )
      throw failPublic(400, 'Área visível inválida.');
    conditions.push(
      sql`${publicFacilities.latitude} BETWEEN ${params.south} AND ${params.north}`,
      sql`${publicFacilities.longitude} BETWEEN ${params.west} AND ${params.east}`,
    );
  }
  const page = params.page ?? 1,
    limit = params.limit ?? 100,
    offset = (page - 1) * limit;
  const where = and(...conditions);
  const [count] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(publicFacilities)
    .innerJoin(dataSources, eq(dataSources.id, publicFacilities.sourceId))
    .where(where);
  const rows = await db
    .select(facilityProjection)
    .from(publicFacilities)
    .innerJoin(dataSources, eq(dataSources.id, publicFacilities.sourceId))
    .where(where)
    .orderBy(asc(publicFacilities.name), asc(publicFacilities.id))
    .limit(limit)
    .offset(offset);
  return {
    items: rows.map((row) =>
      presentFacility(
        row,
        sources.find((source) => source.sourceId === row.sourceId)!,
      ),
    ),
    total: sources.every(
      (source) =>
        ['available', 'stale'].includes(source.state) &&
        source.coverage === 'complete',
    )
      ? count.n
      : null,
    page,
    limit,
    hasMore: offset + rows.length < count.n,
    sources,
  };
}
export async function getPublicFacility(
  db: ReadDatabase,
  id: string,
): Promise<PublicFacility> {
  const [row] = await db
    .select({ ...facilityProjection, geometry: publicFacilities.geometry })
    .from(publicFacilities)
    .innerJoin(dataSources, eq(dataSources.id, publicFacilities.sourceId))
    .where(and(activeFacilities(), eq(publicFacilities.id, id)))
    .limit(1);
  if (!row)
    throw failPublic(404, 'Equipamento não encontrado na base publicada.');
  const source = (await getSiurbSources(db)).find(
    (source) => source.sourceId === row.sourceId,
  );
  if (!source) throw failPublic(404, 'Fonte não publicada.');
  return { ...presentFacility(row, source), geometry: row.geometry };
}
export async function getFacilityCounts(
  db: ReadDatabase,
  neighborhoodId: string,
): Promise<Record<FacilityCategory, number | null>> {
  const sources = await getSiurbSources(db);
  const rows = await db
    .select({
      category: publicFacilities.category,
      n: sql<number>`count(*)::int`,
    })
    .from(publicFacilities)
    .innerJoin(dataSources, eq(dataSources.id, publicFacilities.sourceId))
    .where(
      and(
        activeFacilities(),
        eq(publicFacilities.neighborhoodId, neighborhoodId),
      ),
    )
    .groupBy(publicFacilities.category);
  return Object.fromEntries(
    (Object.keys(CATEGORY_SOURCES) as FacilityCategory[]).map((category) => {
      const source = sources.find(
        (s) => s.sourceId === CATEGORY_SOURCES[category],
      )!;
      return [
        category,
        ['available', 'stale'].includes(source.state) &&
        source.coverage === 'complete'
          ? (rows.find((row) => row.category === category)?.n ?? 0)
          : null,
      ];
    }),
  ) as Record<FacilityCategory, number | null>;
}
