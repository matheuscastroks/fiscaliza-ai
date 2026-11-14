import type {
  FacilityCategory,
  SourceCoverage,
} from '../../../shared/public-data.ts';
import { facilityPalette } from '../../theme/palette.ts';
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
export const facilityColors = facilityPalette;
export function chooseTerritorialEntries<C, F extends { category: string }>(
  calls: C[],
  facilities: F[],
  layers: TerritoryLayer[],
  scope?: { neighborhood?: string; neighborhoodId?: string },
) {
  return [
    ...(layers.includes('official')
      ? calls.map((item) => ({ type: 'official' as const, item }))
      : []),
    ...(scope?.neighborhood && !scope.neighborhoodId ? [] : facilities)
      .filter((item) => layers.includes(item.category as FacilityCategory))
      .map((item) => ({ type: 'facility' as const, item })),
  ];
}
export function facilityNeighborhoodLabel(item: {
  neighborhoodId: string | null;
  neighborhoodName: string | null;
}) {
  if (item.neighborhoodId)
    return item.neighborhoodName || 'Nome do bairro não informado';
  return (
    'Bairro não confirmado' +
    (item.neighborhoodName
      ? ` · Informado pela fonte: ${item.neighborhoodName}`
      : '')
  );
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
  if (!name.trim()) return null;
  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  const normalizedName = normalize(name);
  const matches = options.filter(
    (item) => normalize(item.name) === normalizedName,
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

export const TERRITORY_STATUS_OPTIONS = [
  { value: 'all', label: 'Todas situações' },
  { value: 'Não Encerrado', label: 'Em atendimento' },
  { value: 'Encerrado', label: 'Encerrados' },
];

export const TERRITORY_PERIOD_OPTIONS = [
  { value: '30', label: '30 dias da base' },
  { value: '90', label: '90 dias da base' },
  { value: 'all', label: 'Todo o período' },
];

export function computeRegionBounds(r: {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}) {
  const latSpan = Math.max(0.008, r.latitudeDelta || 0.08);
  const lngSpan = Math.max(0.008, r.longitudeDelta || 0.08);
  return {
    north: r.latitude + latSpan / 2,
    south: r.latitude - latSpan / 2,
    east: r.longitude + lngSpan / 2,
    west: r.longitude - lngSpan / 2,
  };
}

export function computeOverviewRegion<T extends { latitude: number; longitude: number }>(
  points: T[],
  fallback: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
    zoom?: number;
  },
): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  zoom?: number;
  bounds?: { northEast: [number, number]; southWest: [number, number] };
} {
  if (points.length === 0) return fallback;
  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;

  for (const p of points) {
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLng) minLng = p.longitude;
    if (p.longitude > maxLng) maxLng = p.longitude;
  }

  const latDelta = Math.max(0.04, (maxLat - minLat) * 1.35);
  const lngDelta = Math.max(0.04, (maxLng - minLng) * 1.35);
  const delta = Math.max(latDelta, lngDelta, 0.001);
  const zoom = Math.max(11, Math.min(15, Math.round(Math.log2(360 / delta))));

  // Pontos colados (um só chamado) ganham uma caixa mínima para a câmera não aproximar demais.
  const padLat = Math.max(0, (0.004 - (maxLat - minLat)) / 2);
  const padLng = Math.max(0, (0.004 - (maxLng - minLng)) / 2);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
    zoom,
    bounds: {
      northEast: [maxLng + padLng, maxLat + padLat] as [number, number],
      southWest: [minLng - padLng, minLat - padLat] as [number, number],
    },
  };
}

