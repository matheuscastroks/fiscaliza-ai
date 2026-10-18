import type { CivicItem, Occurrence } from './contracts.js';
type Record = CivicItem | Occurrence;
export type TerritoryOrder = 'date' | 'supports' | 'views';
const timestamp = (item: Record) =>
  Date.parse('kind' in item ? item.createdAt : item.reportedAt) || 0;
export function withinPeriod(item: Record, days: number, now = Date.now()) {
  return (
    days === 0 ||
    (timestamp(item) >= now - days * 86400000 && timestamp(item) <= now)
  );
}
export function compareTerritoryRecords(
  a: Record,
  b: Record,
  order: TerritoryOrder,
) {
  const metric = (item: Record) =>
    order === 'supports'
      ? 'kind' in item
        ? item.supports
        : item.votes
      : order === 'views'
        ? item.views || 0
        : timestamp(item);
  return (
    metric(b) - metric(a) ||
    timestamp(b) - timestamp(a) ||
    a.id.localeCompare(b.id)
  );
}
