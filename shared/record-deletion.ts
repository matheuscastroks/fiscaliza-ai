import type { CivicItem, Occurrence } from './contracts.js';

/** Municipal activity remains public even if a record later returns to pending. */
export function canDeleteRecord(value: Occurrence | CivicItem): boolean {
  if ('kind' in value)
    return (
      value.kind === 'proposal' &&
      value.status === 'submitted' &&
      !value.history?.length &&
      !value.decision?.trim()
    );
  return (
    value.status === 'pending' &&
    !value.sector &&
    !value.resolvedAt &&
    !value.evaluation &&
    !value.statusHistory.some(
      (event, index) =>
        event.source === 'management' ||
        event.status !== 'pending' ||
        (event.source !== 'citizen' && index > 0) ||
        Boolean(event.sector),
    )
  );
}
