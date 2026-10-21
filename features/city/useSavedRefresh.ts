import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsFocused } from 'expo-router';
import { fetchOfficialCall } from '@/services/officialCalls';
import { useFollowStore } from '@/stores/followStore';

/** At most three concurrent detail reads; never scan the municipal catalogue. */
export function useSavedRefresh() {
  const active = useIsFocused();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    current.current?.abort();
    const controller = new AbortController();
    current.current = controller;
    setRefreshing(true);
    setError(null);
    try {
      await useFollowStore.getState().initialize();
      const ids = useFollowStore.getState().savedCalls.map((c) => c.id);
      let cursor = 0;
      let failures = 0;
      const fresh: Awaited<ReturnType<typeof fetchOfficialCall>>[] = [];
      await Promise.all(
        Array.from({ length: Math.min(3, ids.length) }, async () => {
          while (cursor < ids.length && !controller.signal.aborted) {
            const id = ids[cursor++];
            try {
              fresh.push(await fetchOfficialCall(id, controller.signal));
            } catch {
              if (!controller.signal.aborted) failures++;
            }
          }
        }),
      );
      if (controller.signal.aborted) return;
      if (fresh.length) await useFollowStore.getState().updateSnapshots(fresh);
      if (failures)
        setError(
          'Alguns chamados não puderam ser atualizados. Mantivemos a última informação consultada.',
        );
    } finally {
      if (current.current === controller) setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    if (active) void refresh();
    return () => {
      current.current?.abort();
    };
  }, [active, refresh]);
  return { refresh, refreshing, error };
}
