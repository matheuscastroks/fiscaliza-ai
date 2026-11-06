import type { CapturedDeviceLocation, Point, TerritorySelection } from '../places/types';

export type MapSearchArea = Point & { radiusMeters: number; source: 'current' | 'place'; capturedAt?: number };
type GeographicCircle = Point & { radiusMeters: number };
const EARTH_RADIUS_METERS = 6371000;
const CIRCLE_SEGMENTS = 96;
const radians = (degrees: number) => degrees * Math.PI / 180;
const degrees = (angle: number) => angle * 180 / Math.PI;

function validPoint(point: Point | null | undefined): point is Point {
  return Boolean(point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180);
}

export function pointFeature(point: Point | null | undefined) {
  if (!validPoint(point)) return null;
  return { type: 'Feature' as const, properties: {}, geometry: { type: 'Point' as const, coordinates: [point.longitude, point.latitude] } };
}

/** Same spherical radius as the API; coordinates are always [longitude, latitude]. */
export function circleFeature(area: GeographicCircle | null | undefined) {
  if (!validPoint(area) || !area || !Number.isFinite(area.radiusMeters) || area.radiusMeters <= 0) return null;
  const latitude = radians(area.latitude), longitude = radians(area.longitude);
  const angle = area.radiusMeters / EARTH_RADIUS_METERS;
  const ring: number[][] = [];
  for (let i = 0; i < CIRCLE_SEGMENTS; i++) {
    const bearing = i / CIRCLE_SEGMENTS * Math.PI * 2;
    const lat = Math.asin(Math.sin(latitude) * Math.cos(angle) + Math.cos(latitude) * Math.sin(angle) * Math.cos(bearing));
    const lng = longitude + Math.atan2(Math.sin(bearing) * Math.sin(angle) * Math.cos(latitude), Math.cos(angle) - Math.sin(latitude) * Math.sin(lat));
    ring.push([((degrees(lng) + 540) % 360) - 180, degrees(lat)]);
  }
  ring.push([...ring[0]]);
  return { type: 'Feature' as const, properties: {}, geometry: { type: 'Polygon' as const, coordinates: [ring] } };
}

export function circleBounds(shape: NonNullable<ReturnType<typeof circleFeature>>) {
  const ring = shape.geometry.coordinates[0];
  return {
    northEast: [Math.max(...ring.map(p => p[0])), Math.max(...ring.map(p => p[1]))] as [number, number],
    southWest: [Math.min(...ring.map(p => p[0])), Math.min(...ring.map(p => p[1]))] as [number, number],
  };
}

export function mapOverlayContext(selection: TerritorySelection, location: CapturedDeviceLocation | null | undefined, areaDisabled: boolean) {
  const searchArea: MapSearchArea | null = selection.kind === 'radius' && !areaDisabled
    ? { latitude: selection.latitude, longitude: selection.longitude, radiusMeters: selection.radiusMeters, source: selection.source, capturedAt: selection.source === 'current' ? selection.capturedAt : undefined } : null;
  return { searchArea, deviceLocation: validPoint(location) ? location : null };
}

export function mapLocationDescription(selection: TerritorySelection, location: CapturedDeviceLocation | null) {
  if (selection.kind === 'pending-current') return 'Atualize a localização pelo botão de posição ou escolha um bairro para consultar.';
  if (!location) return '';
  const time = new Date(location.capturedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const precision = location.accuracyMeters == null ? 'Precisão não informada.' : `Precisão aproximada: ${Math.round(location.accuracyMeters)} m.`;
  const warning = selection.kind === 'radius' && location.accuracyMeters != null && location.accuracyMeters > selection.radiusMeters
    ? ' A precisão excede o raio; amplie o entorno ou escolha outro ponto.' : '';
  return `Ponto azul: posição capturada em ${time}. ${precision}${warning}`;
}
