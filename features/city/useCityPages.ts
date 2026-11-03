import { useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/services/http';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 50;

/** Collection queries keep filters in their cache identity and cancel old requests. */
export function useCityPages<T extends { id: string }>(path: string, enabled = true) {
  const client = useQueryClient();
  const userId = useAuthStore(s => s.user?.id);
  const municipalityId = useAuthStore(s => s.user?.municipality?.id);
  const authenticated = useAuthStore(s => s.isAuthenticated);
  const canFetch = Boolean(enabled && authenticated && userId && municipalityId);
  const query = useInfiniteQuery({
    queryKey: ['municipalityPages', municipalityId, userId, path],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => request<T[]>(
      `${path}${path.includes('?') ? '&' : '?'}limit=${PAGE_SIZE}&offset=${pageParam}`,
      'GET', undefined, signal,
    ),
    getNextPageParam: (last, _pages, offset) => last.length === PAGE_SIZE ? offset + PAGE_SIZE : undefined,
    enabled: canFetch,
    staleTime: 15_000,
  });
  const { refetch } = query;
  useFocusEffect(useCallback(() => {
    const state = client.getQueryState(['municipalityPages', municipalityId, userId, path]);
    if (canFetch && state && (state.isInvalidated || Date.now() - state.dataUpdatedAt >= 15_000)) {
      void refetch();
    }
  }, [canFetch, client, municipalityId, userId, path, refetch]));
  const items = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages.flat() || []).filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [query.data]);
  return { ...query, items };
}
