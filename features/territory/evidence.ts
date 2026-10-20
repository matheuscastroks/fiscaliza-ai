import type { TerritoryLayer } from './selectors.ts';
export const countLabel = (value: number | null) =>
  value === null ? 'Indisponível' : value.toLocaleString('pt-BR');
export const coverageLabel = (value: string) =>
  value === 'partial'
    ? 'Cobertura parcial'
    : value === 'complete'
      ? 'Extração completa da fonte'
      : 'Cobertura não confirmada';
export const dayLabel = (value: string) =>
  value.slice(0, 10).split('-').reverse().join('/');
export const periodLabel = (dates: { startDate: string; endDate: string }) =>
  `${dayLabel(dates.startDate)} a ${dayLabel(dates.endDate)}`;
export const evidenceScope = (
  neighborhoodId: string,
  layer: TerritoryLayer,
  dates: { startDate: string; endDate: string },
) => ({ neighborhoodId, layer, ...dates });
export function initialPeriod() {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}
