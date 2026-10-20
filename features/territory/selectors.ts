import type {
  FacilityCategory,
  SourceCoverage,
} from '../../shared/public-data.ts';
export type TerritoryLayer = 'official' | FacilityCategory;
export const facilityLabels = {
  school: 'Escolas',
  health: 'Saúde',
  square: 'Espaços públicos',
};
export const facilityIcons = {
  school: 'school-outline',
  health: 'medical-outline',
  square: 'leaf-outline',
} as const;
export const facilityColors = {
  school: '#98632B',
  health: '#247B83',
  square: '#347453',
};
export function chooseTerritorialEntries<C, F extends { category: string }>(
  calls: C[],
  facilities: F[],
  layers: TerritoryLayer[],
) {
  return [
    ...(layers.includes('official')
      ? calls.map((item) => ({ type: 'official' as const, item }))
      : []),
    ...facilities
      .filter((item) => layers.includes(item.category as FacilityCategory))
      .map((item) => ({ type: 'facility' as const, item })),
  ];
}
export function summarizeLayer(displayed: number, total: number | null) {
  return total === null
    ? 'Total indisponível'
    : `${displayed.toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')}`;
}
export function resolveNeighborhood<T extends { id: string; name: string }>(
  name: string,
  options: T[],
): T | null {
  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase('pt-BR');
  const matches = options.filter(
    (item) => normalize(item.name) === normalize(name),
  );
  return matches.length === 1 ? matches[0] : null;
}
export function samePublication(
  a: Pick<SourceCoverage, 'sourceId' | 'publicationId'>[],
  b: Pick<SourceCoverage, 'sourceId' | 'publicationId'>[],
) {
  return (
    a.length === b.length &&
    a.every((x) =>
      b.some(
        (y) => x.sourceId === y.sourceId && x.publicationId === y.publicationId,
      ),
    )
  );
}
/** Safe for both script-tag initialization and injected JS. Labels are never HTML. */
export function scriptJson(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
