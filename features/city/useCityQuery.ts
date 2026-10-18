import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { request, requestAll } from '@/services/http';
import { useAuthStore } from '@/stores/authStore';
export function useCityQuery<T>(path: string, enabled = true) {
  const municipalityId = useAuthStore((state) => state.user?.municipality?.id);
  const userId = useAuthStore((state) => state.user?.id);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const canFetch = Boolean(
    enabled && authenticated && userId && municipalityId,
  );
  const query = useQuery<T, Error>({
    queryKey: ['municipality', municipalityId, userId, path],
    enabled: canFetch,
    queryFn: () =>
      path === '/occurrences' || path === '/civic-items'
        ? (requestAll(path) as Promise<T>)
        : request<T>(path),
  });
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      if (canFetch) void refetch();
    }, [refetch, canFetch]),
  );
  return query;
}
