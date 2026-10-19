import type { Municipality } from '../../shared/contracts';

export function municipalityRegion(municipality?: Municipality | null) {
  if (!municipality)
    return {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  return {
    ...municipality.center,
    latitudeDelta: Math.max(
      0.02,
      (municipality.bounds.north - municipality.bounds.south) * 1.15,
    ),
    longitudeDelta: Math.max(
      0.02,
      (municipality.bounds.east - municipality.bounds.west) * 1.15,
    ),
  };
}
/** Quick UI feedback only. The API checks the actual municipal polygon. */
export function withinMunicipalBounds(
  point: { latitude: number; longitude: number },
  municipality?: Municipality | null,
) {
  return Boolean(
    municipality &&
    point.latitude >= municipality.bounds.south &&
    point.latitude <= municipality.bounds.north &&
    point.longitude >= municipality.bounds.west &&
    point.longitude <= municipality.bounds.east,
  );
}

export function regionToCameraPosition(region: {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}) {
  const delta = Math.max(region.latitudeDelta, region.longitudeDelta, 0.001);
  const zoom = Math.max(3, Math.min(18, Math.round(Math.log2(360 / delta))));
  return {
    coordinates: {
      latitude: region.latitude,
      longitude: region.longitude,
    },
    zoom,
  };
}

