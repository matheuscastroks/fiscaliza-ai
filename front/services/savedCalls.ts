import { request } from '@/services/http';
import type { SavedCallsAccountApi } from '@/stores/followStore';

// Lista de chamados salvos guardada na conta (veja followStore).
export const savedCallsAccountApi: SavedCallsAccountApi = {
  list: async () =>
    (await request<{ items: { call: import('@/shared/contracts').OfficialCall; savedAt: string }[] }>(
      '/v1/saved-calls',
    )).items,
  merge: async (ids) => {
    await request('/v1/saved-calls/merge', 'POST', { callIds: ids });
  },
  remove: async (id) => {
    await request(`/v1/saved-calls/${encodeURIComponent(id)}`, 'DELETE');
  },
  clear: async () => {
    await request('/v1/saved-calls', 'DELETE');
  },
};
