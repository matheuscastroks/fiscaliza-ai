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
export function usePublicFacilities(params: FacilitiesQuery, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['publicFacilities', '3304557', params],
    initialPageParam: { page: 1, sources: null as SourceCoverage[] | null },
    queryFn: async ({ pageParam }) => {
      const result = await fetchPublicFacilities({
        ...params,
        page: pageParam.page,
        limit: 100,
      });
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
export const usePublicFacility = (id?: string) =>
  useQuery({
    queryKey: ['publicFacility', '3304557', id],
    queryFn: () => fetchPublicFacility(id!),
    enabled: Boolean(id),
  });
export const useNeighborhoods = () =>
  useQuery({
    queryKey: ['neighborhoods', '3304557'],
    queryFn: fetchNeighborhoods,
    staleTime: 300000,
  });
export const useNeighborhoodBoundary = (id?: string) =>
  useQuery({
    queryKey: ['neighborhoodBoundary', '3304557', id],
    queryFn: () => fetchNeighborhoodBoundary(id!),
    enabled: Boolean(id),
    staleTime: 300000,
  });
export const usePublicSources = () =>
  useQuery({
    queryKey: ['publicSources', '3304557'],
    queryFn: fetchPublicSources,
    staleTime: 60000,
  });
export const useNeighborhoodOverview = (
  id: string | undefined,
  dates: { startDate: string; endDate: string },
) =>
  useQuery({
    queryKey: ['neighborhoodOverview', '3304557', id, dates],
    queryFn: () => fetchNeighborhoodOverview(id!, dates),
    enabled: Boolean(id),
  });
