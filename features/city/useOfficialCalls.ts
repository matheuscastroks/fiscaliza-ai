import { useQuery } from '@tanstack/react-query';
import {
  fetchOfficialCalls,
  fetchOfficialCall,
  fetchOfficialFilters,
  fetchOfficialOverview,
  fetchSyncStatus,
} from '@/services/officialCalls';
import type { OfficialCallsQueryParams } from '@/shared/contracts';

export function useOfficialCalls(params: OfficialCallsQueryParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['officialCalls', params],
    queryFn: () => fetchOfficialCalls(params),
    enabled,
    staleTime: 60 * 1000, // 1 min cache
  });
}

export function useOfficialCall(id: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['officialCall', id],
    queryFn: () => {
      if (!id) throw new Error('Call ID is required');
      return fetchOfficialCall(id);
    },
    enabled: Boolean(enabled && id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOfficialFilters(enabled = true) {
  return useQuery({
    queryKey: ['officialCallsFilters'],
    queryFn: () => fetchOfficialFilters(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 min cache
  });
}

export function useOfficialOverview(enabled = true) {
  return useQuery({
    queryKey: ['officialCallsOverview'],
    queryFn: () => fetchOfficialOverview(),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSyncStatus(enabled = true) {
  return useQuery({
    queryKey: ['officialCallsSyncStatus'],
    queryFn: () => fetchSyncStatus(),
    enabled,
    staleTime: 30 * 1000,
  });
}
