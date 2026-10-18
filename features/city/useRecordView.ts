import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { queryClient, request } from '@/services/http';
import { useAuthStore } from '@/stores/authStore';

/** An idempotent view is distinct from following or supporting a record. */
export function useRecordView(path: string, enabled: boolean) {
  const userId = useAuthStore((state) => state.user?.id);
  const municipality = useAuthStore((state) => state.user?.municipality?.id);
  const version = useAuthStore((state) => state.sessionVersion);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(
    useCallback(() => {
      if (!enabled || !userId || !municipality) return;
      let active = true;
      void request(path + '/view', 'PUT')
        .then(async () => {
          const current = useAuthStore.getState();
          if (
            !active ||
            current.user?.id !== userId ||
            current.user?.municipality?.id !== municipality ||
            current.sessionVersion !== version
          )
            return;
          setError('');
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ['municipality', municipality, userId, path],
              exact: true,
            }),
            queryClient.invalidateQueries({
              queryKey: [
                'municipality',
                municipality,
                userId,
                path.split('/').slice(0, 2).join('/'),
              ],
              exact: true,
            }),
          ]);
        })
        .catch(() => {
          if (active) setError('Não foi possível registrar sua visualização.');
        });
      return () => {
        active = false;
      };
    }, [path, enabled, userId, municipality, version, attempt]),
  );
  return { error, retry: () => setAttempt((value) => value + 1) };
}
