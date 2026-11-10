import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  fetchPublicFacilities,
  fetchPublicFacility,
  fetchNeighborhoods,
  fetchNeighborhoodBoundary,
  fetchPublicSources,
  fetchNeighborhoodOverview,
} from '@/services/publicData';
import type { FacilitiesQuery, SourceCoverage } from '@/shared/public-data';
import { samePublication } from './selectors';
import { useMunicipalityId } from '@/features/city/municipality';
export function usePublicFacilities(
  params: FacilitiesQuery,
  enabled = true,
  scope = 'municipality',
) {
  const municipalityId = useMunicipalityId();
  return useInfiniteQuery({
    queryKey: ['publicFacilities', municipalityId, scope, params],
    initialPageParam: { page: 1, sources: null as SourceCoverage[] | null },
    queryFn: async ({ pageParam, signal }) => {
      const result = await fetchPublicFacilities(
        {
          ...params,
          page: pageParam.page,
          limit: 100,
        },
        signal,
      );
      if (
        pageParam.sources &&
        !samePublication(pageParam.sources, result.sources)
      )
        throw new Error(
          'O cadastro foi atualizado. Atualize esta camada para continuar.',
        );
      return result;
    },
    getNextPageParam: (last) =>
      last.hasMore ? { page: last.page + 1, sources: last.sources } : undefined,
    enabled,
    staleTime: 60000,
  });
}
export function usePublicFacility(id?: string) {
  const municipalityId = useMunicipalityId();
  return useQuery({
    queryKey: ['publicFacility', municipalityId, id],
    queryFn: ({ signal }) => fetchPublicFacility(id as string, signal),
    enabled: Boolean(id),
  });
}
export function useNeighborhoods() {
  const municipalityId = useMunicipalityId();
  return useQuery({
    queryKey: ['neighborhoods', municipalityId],
    queryFn: ({ signal }) => fetchNeighborhoods(signal),
    staleTime: 300000,
  });
}
export function useNeighborhoodBoundary(id?: string) {
  const municipalityId = useMunicipalityId();
  return useQuery({
    queryKey: ['neighborhoodBoundary', municipalityId, id],
    queryFn: ({ signal }) => fetchNeighborhoodBoundary(id as string, signal),
    enabled: Boolean(id),
    staleTime: 300000,
  });
}
export function usePublicSources(enabled = true) {
  const municipalityId = useMunicipalityId();
  return useQuery({
    queryKey: ['publicSources', municipalityId],
    queryFn: ({ signal }) => fetchPublicSources(signal),
    enabled,
    staleTime: 60000,
  });
}
export function useNeighborhoodOverview(
  id: string | undefined,
  dates: { startDate: string; endDate: string },
) {
  const municipalityId = useMunicipalityId();
  return useQuery({
    queryKey: ['neighborhoodOverview', municipalityId, id, dates],
    queryFn: ({ signal }) =>
      fetchNeighborhoodOverview(id as string, dates, signal),
    enabled: Boolean(id),
  });
}
