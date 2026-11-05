import { and, desc, isNotNull, sql, type SQL } from 'drizzle-orm';
import type { ReadDatabase } from './db.js';
import type { OfficialCallsOverview } from '../../shared/contracts.js';
import { officialCalls } from './schema.js';
import { getSyncStatus } from './integrations/rio1746/sync.js';
export async function queryOfficialOverview(
  db: ReadDatabase,
  whereClause?: SQL,
): Promise<OfficialCallsOverview> {
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

  const topServices = await db
    .select({
      type: officialCalls.serviceType,
      count: sql<number>`count(*)::int`,
    })
    .from(officialCalls)
    .where(whereClause)
    .groupBy(officialCalls.serviceType)
    .orderBy(desc(sql`count(*)`))
    .limit(10);
  const topNeighborhoods = await db
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
    .limit(10);
  const situationBreakdown = await db
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
    .orderBy(desc(sql`count(*)`));
  const statusBreakdown = await db
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
    .limit(8);
  const checkpoint = await getSyncStatus(db);

  const withinDeadlineCount = counts?.withinDeadline || 0;
  const overdueCount = counts?.overdue || 0;
  const slaDenominator = withinDeadlineCount + overdueCount;
  const withinDeadlineRate =
    slaDenominator > 0
      ? Math.round((withinDeadlineCount / slaDenominator) * 100)
      : 0;

  return {
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
    lastPartitionDate:
      counts?.latestPartition || checkpoint?.lastPartition || null,
    lastSyncedAt: checkpoint?.lastSyncedAt
      ? checkpoint.lastSyncedAt.toISOString()
      : null,
  };
}
