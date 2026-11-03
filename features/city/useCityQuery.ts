import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/services/http';
import { useAuthStore } from '@/stores/authStore';
export function useCityQuery<T>(path: string, enabled = true) {
  const client = useQueryClient();
  const municipalityId = useAuthStore((state) => state.user?.municipality?.id);
  const userId = useAuthStore((state) => state.user?.id);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const canFetch = Boolean(
    enabled && authenticated && userId && municipalityId,
  );
  const queryFn = useCallback(({ signal }: { signal: AbortSignal }) =>
    request<T>(path, 'GET', undefined, signal), [path]);
  const query = useQuery<T, Error>({
    queryKey: ['municipality', municipalityId, userId, path],
    enabled: canFetch,
    queryFn,
    staleTime: 15_000,
  });
  useFocusEffect(
    useCallback(() => {
      if (canFetch) void client.fetchQuery({
        queryKey: ['municipality', municipalityId, userId, path],
        queryFn,
        staleTime: 15_000,
      }).catch(() => { /* The observer exposes errors and retry. */ });
    }, [client, municipalityId, userId, path, queryFn, canFetch]),
  );
  return query;
}
