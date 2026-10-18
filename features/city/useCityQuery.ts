import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { request, requestAll } from '@/services/http';
import { useAuthStore } from '@/stores/authStore';
export function useCityQuery<T>(path: string) {
  const municipalityId = useAuthStore((state) => state.user?.municipality?.id);
  const query = useQuery<T, Error>({
    queryKey: ['municipality', municipalityId, path],
    enabled: Boolean(municipalityId),
    queryFn: () =>
      path === '/occurrences' || path === '/civic-items'
        ? (requestAll(path) as Promise<T>)
        : request<T>(path),
  });
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      if (municipalityId) void refetch();
    }, [refetch, municipalityId]),
  );
  return query;
}
