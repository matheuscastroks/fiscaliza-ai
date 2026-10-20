import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
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
  const query = useQuery({
    queryKey: ['officialCalls', params],
    queryFn: () => fetchOfficialCalls(params),
    enabled,
    staleTime: 30 * 1000,
  });
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      if (enabled) void refetch();
    }, [refetch, enabled]),
  );
  return query;
}

export function useOfficialCall(id: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['officialCall', id],
    queryFn: () => {
      if (!id) throw new Error('Call ID is required');
      return fetchOfficialCall(id);
    },
    enabled: Boolean(enabled && id),
    staleTime: 60 * 1000,
  });
}

export function useOfficialFilters(enabled = true) {
  return useQuery({
    queryKey: ['officialCallsFilters'],
    queryFn: () => fetchOfficialFilters(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useOfficialOverview(bairro?: string, enabled = true) {
  const query = useQuery({
    queryKey: ['officialCallsOverview', bairro || ''],
    queryFn: () => fetchOfficialOverview(bairro || undefined),
    enabled,
    staleTime: 30 * 1000,
  });
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      if (enabled) void refetch();
    }, [refetch, enabled]),
  );
  return query;
}

export function useSyncStatus(enabled = true) {
  return useQuery({
    queryKey: ['officialCallsSyncStatus'],
    queryFn: () => fetchSyncStatus(),
    enabled,
    staleTime: 30 * 1000,
  });
}
