import type { OfficialCallsOverview } from '@/shared/contracts';

export type NeighborhoodStat = NonNullable<OfficialCallsOverview['neighborhoodRanking']>[number];

/** Volume mínimo para um bairro entrar em rankings de taxa ou velocidade. */
export const MIN_RANKING_VOLUME = 30;

const eligible = (rows: NeighborhoodStat[], min: number) =>
  rows.filter((row) => row.count >= min);

export function topByVolume(rows: NeighborhoodStat[] = [], limit = 5) {
  return [...rows].sort((a, b) => b.count - a.count).slice(0, limit);
}

/** Maior cumprimento de prazo; empate decidido pelo maior volume. */
export function topByDeadlineRate(rows: NeighborhoodStat[] = [], limit = 5, min = MIN_RANKING_VOLUME) {
  return eligible(rows, min)
    .filter((row) => row.withinDeadlineRate != null)
    .sort((a, b) => (b.withinDeadlineRate! - a.withinDeadlineRate!) || b.count - a.count)
    .slice(0, limit);
}

/** Menor tempo médio de encerramento publicado. */
export function fastestResolution(rows: NeighborhoodStat[] = [], limit = 5, min = MIN_RANKING_VOLUME) {
  return eligible(rows, min)
    .filter((row) => row.avgResolutionDays != null && row.closedCount > 0)
    .sort((a, b) => (a.avgResolutionDays! - b.avgResolutionDays!) || b.count - a.count)
    .slice(0, limit);
}

export function slowestResolution(rows: NeighborhoodStat[] = [], limit = 5, min = MIN_RANKING_VOLUME) {
  return eligible(rows, min)
    .filter((row) => row.avgResolutionDays != null && row.closedCount > 0)
    .sort((a, b) => (b.avgResolutionDays! - a.avgResolutionDays!) || b.count - a.count)
    .slice(0, limit);
}

export function formatDays(days: number | null | undefined) {
  if (days == null || !Number.isFinite(days)) return '—';
  if (days < 1) return 'menos de 1 dia';
  const rounded = Math.round(days);
  return `${rounded} ${rounded === 1 ? 'dia' : 'dias'}`;
}
