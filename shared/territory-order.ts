import type { CivicItem, Occurrence, OfficialCall } from './contracts.js';
type Record = CivicItem | Occurrence | OfficialCall;
export type TerritoryOrder = 'date' | 'supports' | 'views';
const timestamp = (item: Record) => {
  if ('openedAt' in item) return Date.parse(item.openedAt) || 0;
  return Date.parse('kind' in item ? item.createdAt : item.reportedAt) || 0;
};
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
  const metric = (item: Record) => {
    if ('openedAt' in item) {
      return order === 'date' ? timestamp(item) : 0;
    }
    return order === 'supports'
      ? 'kind' in item
        ? item.supports
        : item.votes
      : order === 'views'
        ? item.views || 0
        : timestamp(item);
  };
  return (
    metric(b) - metric(a) ||
    timestamp(b) - timestamp(a) ||
    a.id.localeCompare(b.id)
  );
}
