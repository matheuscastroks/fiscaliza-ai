import { request } from './http';
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
): Promise<FacilitiesPage> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '')
      query.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  return request(`/public-facilities?${query}`);
}
export const fetchPublicFacility = (id: string) =>
  request<PublicFacility>(`/public-facilities/${encodeURIComponent(id)}`);
export const fetchNeighborhoods = () =>
  request<NeighborhoodSummary[]>('/territorial-boundaries');
export const fetchNeighborhoodBoundary = (id: string) =>
  request<NeighborhoodBoundary>(
    `/territorial-boundaries/${encodeURIComponent(id)}`,
  );
export const fetchPublicSources = () =>
  request<PublicSource[]>('/data-sources');
export const fetchNeighborhoodOverview = (
  id: string,
  dates: { startDate: string; endDate: string },
) =>
  request<NeighborhoodOverview>(
    `/neighborhoods/${encodeURIComponent(id)}/overview?${new URLSearchParams(dates)}`,
  );
