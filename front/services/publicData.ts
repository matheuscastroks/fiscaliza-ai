import { request } from './http';
import type { TerritoryLocationResolution } from '@/shared/public-data';
export function fetchTerritoryLocation(point: { latitude: number; longitude: number }, signal?: AbortSignal) {
  const query = new URLSearchParams({ latitude: String(point.latitude), longitude: String(point.longitude) });
  return request<TerritoryLocationResolution>(`/territory/resolve?${query}`, 'GET', undefined, signal);
}
import type {
  FacilitiesQuery,
  FacilitiesPage,
  PublicFacility,
  PublicSource,
  NeighborhoodSummary,
  NeighborhoodBoundary,
  NeighborhoodOverview,
} from '@/shared/public-data';
export function fetchPublicFacilities(
  params: FacilitiesQuery,
  signal?: AbortSignal,
): Promise<FacilitiesPage> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '')
      query.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  return request(`/public-facilities?${query}`, 'GET', undefined, signal);
}
export const fetchPublicFacility = (id: string, signal?: AbortSignal) =>
  request<PublicFacility>(
    `/public-facilities/${encodeURIComponent(id)}`,
    'GET',
    undefined,
    signal,
  );
export const fetchNeighborhoods = (signal?: AbortSignal) =>
  request<NeighborhoodSummary[]>(
    '/territorial-boundaries',
    'GET',
    undefined,
    signal,
  );
export const fetchNeighborhoodBoundary = (id: string, signal?: AbortSignal) =>
  request<NeighborhoodBoundary>(
    `/territorial-boundaries/${encodeURIComponent(id)}`,
    'GET',
    undefined,
    signal,
  );
export const fetchPublicSources = (signal?: AbortSignal) =>
  request<PublicSource[]>('/data-sources', 'GET', undefined, signal);
export const fetchNeighborhoodOverview = (
  id: string,
  dates: { startDate: string; endDate: string },
  signal?: AbortSignal,
) =>
  request<NeighborhoodOverview>(
    `/neighborhoods/${encodeURIComponent(id)}/overview?${new URLSearchParams(dates)}`,
    'GET',
    undefined,
    signal,
  );
