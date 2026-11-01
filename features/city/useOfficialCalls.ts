import { useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  fetchOfficialCalls,
  fetchOfficialCall,
  fetchOfficialFilters,
  fetchOfficialOverview,
  fetchSyncStatus,
  type OfficialOverviewQueryParams,
} from '@/services/officialCalls';
import type { OfficialCallsQueryParams } from '@/shared/contracts';

// fetchQuery respects staleTime; refetch would bypass a still-fresh cache.
function useFreshCallsOnFocus(
  params: OfficialCallsQueryParams,
  enabled: boolean,
) {
  const client = useQueryClient();
  const key = JSON.stringify(params);
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      const filters: OfficialCallsQueryParams = JSON.parse(key);
      void client
        .fetchQuery({
          queryKey: ['officialCalls', filters],
          queryFn: ({ signal }) => fetchOfficialCalls(filters, signal),
          staleTime: 30_000,
        })
        .catch(() => {
          /* useQuery exposes the error and retry state. */
        });
    }, [client, enabled, key]),
  );
}

export function useOfficialCalls(
  params: OfficialCallsQueryParams = {},
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['officialCalls', params],
    queryFn: ({ signal }) => fetchOfficialCalls(params, signal),
    enabled,
    staleTime: 30 * 1000,
  });
  useFreshCallsOnFocus(params, enabled);
  return query;
}

export function useInfiniteOfficialCalls(
  params: OfficialCallsQueryParams,
  enabled = true,
) {
  const query = useInfiniteQuery({
    queryKey: ['officialCallsPages', params],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      fetchOfficialCalls(
        {
          ...params,
          cursor: pageParam,
          includeTotal: !pageParam,
        },
        signal,
      ),
    getNextPageParam: (last) =>
      last.hasMore ? (last.nextCursor ?? undefined) : undefined,
    enabled,
    staleTime: 30_000,
  });
  const data = useMemo(() => {
    if (!query.data) return undefined;
    const pages = query.data.pages;
    const seen = new Set<string>();
    return {
      ...pages[0],
      hasMore: pages.at(-1)?.hasMore ?? false,
      calls: pages
        .flatMap((page) => page.calls)
        .filter((call) => {
          if (seen.has(call.id)) return false;
          seen.add(call.id);
          return true;
        }),
    };
  }, [query.data]);
  return { ...query, data };
}

export function useOfficialCall(id: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['officialCall', id],
    queryFn: ({ signal }) => {
      if (!id) throw new Error('Call ID is required');
      return fetchOfficialCall(id, signal);
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

export function useOfficialOverview(
  params?: string | OfficialOverviewQueryParams,
  enabled = true,
) {
  const client = useQueryClient();
  const key = JSON.stringify(params || '');
  const query = useQuery({
    queryKey: ['officialCallsOverview', params || ''],
    queryFn: ({ signal }) => fetchOfficialOverview(params, signal),
    enabled,
    staleTime: 30 * 1000,
  });
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      const filters = JSON.parse(key);
      void client
        .fetchQuery({
          queryKey: ['officialCallsOverview', filters],
          queryFn: ({ signal }) =>
            fetchOfficialOverview(filters || undefined, signal),
          staleTime: 30_000,
        })
        .catch(() => {
          /* Query exposes errors to its consumer. */
        });
    }, [client, key, enabled]),
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
