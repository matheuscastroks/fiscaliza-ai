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
      withinDeadline: sql<number>`count(case when ${officialCalls.withinDeadline} in ('No Prazo', 'A Vencer (No Prazo)', 'Em Vencimento (No Prazo)') or (${officialCalls.closedAt} is not null and ${officialCalls.targetDate} is not null and ${officialCalls.closedAt} <= ${officialCalls.targetDate}) then 1 end)::int`,
      overdue: sql<number>`count(case when ${officialCalls.withinDeadline} in ('Fora do Prazo', 'Vencido') or (${officialCalls.closedAt} is not null and ${officialCalls.targetDate} is not null and ${officialCalls.closedAt} > ${officialCalls.targetDate}) then 1 end)::int`,
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
  // Dias entre abertura e encerramento publicados; ignora datas inconsistentes.
  const resolutionDays = sql<number | null>`avg(case when ${officialCalls.closedAt} is not null and ${officialCalls.closedAt} >= ${officialCalls.openedAt} then extract(epoch from (${officialCalls.closedAt} - ${officialCalls.openedAt})) / 86400 end)::float`;
  const [speed] = await db
    .select({ avgDays: resolutionDays })
    .from(officialCalls)
    .where(whereClause);
  const neighborhoodRanking = await db
    .select({
      neighborhood: officialCalls.neighborhoodName,
      count: sql<number>`count(*)::int`,
      closed: sql<number>`count(case when ${officialCalls.officialSituation} = 'Encerrado' then 1 end)::int`,
      withinDeadline: sql<number>`count(case when ${officialCalls.withinDeadline} in ('No Prazo', 'A Vencer (No Prazo)', 'Em Vencimento (No Prazo)') or (${officialCalls.closedAt} is not null and ${officialCalls.targetDate} is not null and ${officialCalls.closedAt} <= ${officialCalls.targetDate}) then 1 end)::int`,
      overdue: sql<number>`count(case when ${officialCalls.withinDeadline} in ('Fora do Prazo', 'Vencido') or (${officialCalls.closedAt} is not null and ${officialCalls.targetDate} is not null and ${officialCalls.closedAt} > ${officialCalls.targetDate}) then 1 end)::int`,
      avgDays: resolutionDays,
    })
    .from(officialCalls)
    .where(
      whereClause
        ? and(isNotNull(officialCalls.neighborhoodName), whereClause)
        : isNotNull(officialCalls.neighborhoodName),
    )
    .groupBy(officialCalls.neighborhoodName)
    .orderBy(desc(sql`count(*)`))
    .limit(40);
  const serviceSpeed = await db
    .select({
      type: officialCalls.serviceType,
      count: sql<number>`count(*)::int`,
      avgDays: resolutionDays,
    })
    .from(officialCalls)
    .where(whereClause)
    .groupBy(officialCalls.serviceType)
    .orderBy(desc(sql`count(*)`))
    .limit(10);
  const checkpoint = await getSyncStatus(db);
  const round1 = (v: number | null | undefined) =>
    v == null || !Number.isFinite(Number(v)) ? null : Math.round(Number(v) * 10) / 10;

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
    avgResolutionDays: round1(speed?.avgDays),
    neighborhoodRanking: neighborhoodRanking.map((n) => {
      const sla = n.withinDeadline + n.overdue;
      return {
        neighborhood: n.neighborhood || 'Desconhecido',
        count: n.count,
        closedCount: n.closed,
        overdueCount: n.overdue,
        withinDeadlineRate: sla > 0 ? Math.round((n.withinDeadline / sla) * 100) : null,
        avgResolutionDays: round1(n.avgDays),
      };
    }),
    serviceSpeed: serviceSpeed.map((s) => ({
      type: s.type,
      count: s.count,
      avgResolutionDays: round1(s.avgDays),
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
