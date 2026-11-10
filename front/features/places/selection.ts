import type { OfficialCallsQueryParams } from '../../../shared/contracts';
import type { SavedPlace, TerritorySelection } from './types';

export function toOfficialCallsParams(selection: TerritorySelection): OfficialCallsQueryParams {
  if (selection.kind === 'radius') return { centerLatitude: selection.latitude, centerLongitude: selection.longitude, radiusMeters: selection.radiusMeters };
  if (selection.kind === 'neighborhood') return selection.id ? { neighborhoodId: selection.id } : { bairro: selection.name };
  return {};
}
export function validatePlace(place: { name: string; addressLabel: string; latitude: number; longitude: number; radiusMeters: number }): string | null {
  if (!place.name.trim() || place.name.trim().length > 40) return 'Informe um nome com até 40 caracteres.';
  if (place.addressLabel.length > 160) return 'Use até 160 caracteres no endereço ou referência.';
  if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude) || Math.abs(place.latitude) > 90 || Math.abs(place.longitude) > 180) return 'Confirme um ponto válido no mapa ou pelas coordenadas.';
  if (![500, 1000, 2000, 5000].includes(place.radiusMeters)) return 'Escolha uma distância da lista.';
  return null;
}
export function restoreSelection(value: unknown, places: SavedPlace[]): TerritorySelection {
  const selection = value as TerritorySelection | null;
  if (selection?.kind === 'pending-current' || (selection?.kind === 'radius' && selection.source === 'current')) {
    return { kind: 'pending-current', radiusMeters: [500, 1000, 2000, 5000].includes(selection.radiusMeters) ? selection.radiusMeters : 1000 };
  }
  if (selection?.kind === 'neighborhood' && typeof selection.name === 'string') return { kind: 'neighborhood', name: selection.name, id: selection.id };
  if (selection?.kind === 'radius' && selection.source === 'place') {
    const place = places.find((p) => p.id === selection.placeId);
    if (place) return { kind: 'radius', source: 'place', placeId: place.id, ...place };
  }
  return { kind: 'municipality' };
}
export function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const rad = (n: number) => n * Math.PI / 180;
  const h = Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, h))));
}
