import { and, gte, lte, sql, type SQL } from 'drizzle-orm';
import { officialCalls } from './schema.js';
import { territorialError } from './municipality.js';

export interface RadiusFilter { centerLatitude: number; centerLongitude: number; radiusMeters: number }
export function parseRadiusFilter(query: Record<string, string | undefined>): RadiusFilter | undefined {
  const keys = ['centerLatitude', 'centerLongitude', 'radiusMeters'] as const;
  if (keys.every((key) => query[key] === undefined)) return undefined;
  const values = keys.map((key) => query[key]?.trim());
  const [centerLatitude, centerLongitude, radiusMeters] = values.map(Number);
  if (values.some((value) => !value) || ![centerLatitude, centerLongitude, radiusMeters].every(Number.isFinite) ||
    Math.abs(centerLatitude) > 90 || Math.abs(centerLongitude) > 180 ||
    ![500, 1000, 2000, 5000].includes(radiusMeters) ||
    ['bairro', 'neighborhoodId', 'north', 'south', 'east', 'west'].some((key) => query[key] !== undefined)) {
    throw territorialError(400, 'Informe um centro válido e raio de 500, 1000, 2000 ou 5000 metros, sem bairro ou área simultâneos.');
  }
  return { centerLatitude, centerLongitude, radiusMeters };
}

export function radiusDistanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const radians = (value: number) => value * Math.PI / 180;
  const h = Math.sin(radians(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(radians(b.longitude - a.longitude) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, h))));
}

export function officialRadiusCondition(filter: RadiusFilter): SQL {
  const { centerLatitude: lat, centerLongitude: lng, radiusMeters: radius } = filter;
  const latDelta = radius / 6371000 * 180 / Math.PI;
  const lngDelta = Math.asin(Math.sin(radius / 6371000) / Math.cos(lat * Math.PI / 180)) * 180 / Math.PI;
  const distance = sql`12742000 * asin(sqrt(greatest(0::double precision, least(1::double precision,
    power(sin(radians(${officialCalls.latitude} - ${lat}) / 2), 2) +
    cos(radians(${lat}::double precision)) * cos(radians(${officialCalls.latitude})) *
    power(sin(radians(${officialCalls.longitude} - ${lng}) / 2), 2)))))`;
  return and(
    gte(officialCalls.latitude, lat - latDelta), lte(officialCalls.latitude, lat + latDelta),
    gte(officialCalls.longitude, lng - lngDelta), lte(officialCalls.longitude, lng + lngDelta),
    sql`${distance} <= ${radius}`,
  )!;
}
