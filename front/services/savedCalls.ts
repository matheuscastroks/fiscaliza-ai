import { request } from '@/services/http';
import type { SavedCallsAccountApi } from '@/stores/followStore';
import type { SavedCallsList, SavedCallsMergePayload } from '@/shared/contracts';

// Lista de chamados salvos guardada na conta (veja followStore).
export const savedCallsAccountApi: SavedCallsAccountApi = {
  list: async () =>
    (await request<SavedCallsList>('/v1/saved-calls')).items,
  merge: async (ids) => {
    const payload: SavedCallsMergePayload = { callIds: ids };
    await request('/v1/saved-calls/merge', 'POST', payload);
  },
  remove: async (id) => {
    await request(`/v1/saved-calls/${encodeURIComponent(id)}`, 'DELETE');
  },
  clear: async () => {
    await request('/v1/saved-calls', 'DELETE');
  },
};
