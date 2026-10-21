import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { OfficialCall } from '@/shared/contracts';

export const FOLLOW_STORAGE_KEY = 'fiscaliza-ai:saved:rio1746:3304557:v1';
export type FollowStatusFilter = 'all' | 'open' | 'resolved' | 'saved';
interface SavedMeta {
  savedAt: string;
  checkedAt: string;
}
interface FollowStore {
  hydrated: boolean;
  busy: boolean;
  persistenceError: string | null;
  statusFilter: FollowStatusFilter;
  savedCalls: OfficialCall[];
  metadata: Record<string, SavedMeta>;
  initialize: () => Promise<void>;
  setStatusFilter: (value: FollowStatusFilter) => void;
  toggleStatusFilter: () => void;
  toggleSavedCall: (call: OfficialCall) => Promise<boolean>;
  clearSavedCalls: () => Promise<boolean>;
  updateSnapshots: (calls: OfficialCall[]) => Promise<boolean>;
  isCallSaved: (id: string) => boolean;
}
function validCall(value: unknown): value is OfficialCall {
  if (!value || typeof value !== 'object') return false;
  const c = value as OfficialCall;
  return (
    c.source === 'rio1746' &&
    c.municipalityId === '3304557' &&
    [
      'id',
      'externalId',
      'serviceType',
      'serviceSubtype',
      'openedAt',
      'importedAt',
      'updatedAt',
    ].every(
      (key) =>
        typeof (c as unknown as Record<string, unknown>)[key] === 'string',
    ) &&
    !!c.id
  );
}
function snapshot(call: OfficialCall): OfficialCall {
  const {
    id,
    externalId,
    source,
    municipalityId,
    serviceType,
    serviceSubtype,
    organizationName,
    officialStatus,
    officialSituation,
    openedAt,
    closedAt,
    targetDate,
    withinDeadline,
    neighborhoodId,
    neighborhoodName,
    latitude,
    longitude,
    importedAt,
    updatedAt,
    sourcePartitionDate,
  } = call;
  return {
    id,
    externalId,
    source,
    municipalityId,
    serviceType,
    serviceSubtype,
    organizationName,
    officialStatus,
    officialSituation,
    openedAt,
    closedAt,
    targetDate,
    withinDeadline,
    neighborhoodId,
    neighborhoodName,
    latitude,
    longitude,
    importedAt,
    updatedAt,
    sourcePartitionDate,
  };
}
let initialization: Promise<void> | undefined;
let queue = Promise.resolve();
export const useFollowStore = create<FollowStore>((set, get) => {
  const persist = (
    change: () => {
      savedCalls: OfficialCall[];
      metadata: Record<string, SavedMeta>;
    },
  ) => {
    const result = queue.then(async () => {
      await get().initialize();
      set({ busy: true });
      try {
        const next = change();
        await AsyncStorage.setItem(
          FOLLOW_STORAGE_KEY,
          JSON.stringify({
            version: 1,
            items: next.savedCalls.map((call) => ({
              call: snapshot(call),
              ...next.metadata[call.id],
            })),
          }),
        );
        set({ ...next, persistenceError: null });
        return true;
      } catch {
        set({
          persistenceError:
            'Não foi possível gravar os salvos neste aparelho. Tente novamente.',
        });
        return false;
      } finally {
        set({ busy: false });
      }
    });
    queue = result.then(() => undefined);
    return result;
  };
  return {
    hydrated: false,
    busy: false,
    persistenceError: null,
    statusFilter: 'all',
    savedCalls: [],
    metadata: {},
    initialize: () => {
      if (initialization) return initialization;
      initialization = (async () => {
        try {
          const raw = await AsyncStorage.getItem(FOLLOW_STORAGE_KEY);
          if (!raw) return;
          const document = JSON.parse(raw);
          if (document.version !== 1 || !Array.isArray(document.items))
            throw Error('format');
          const calls = new Map<string, OfficialCall>();
          const metadata: Record<string, SavedMeta> = {};
          for (const entry of document.items) {
            if (!validCall(entry?.call)) continue;
            calls.set(entry.call.id, snapshot(entry.call));
            metadata[entry.call.id] = {
              savedAt:
                typeof entry.savedAt === 'string'
                  ? entry.savedAt
                  : entry.call.importedAt,
              checkedAt:
                typeof entry.checkedAt === 'string'
                  ? entry.checkedAt
                  : entry.call.importedAt,
            };
          }
          set({ savedCalls: [...calls.values()], metadata });
        } catch {
          set({
            persistenceError:
              'Não foi possível ler os salvos deste aparelho. Você pode tentar novamente ao reabrir o app.',
          });
        } finally {
          set({ hydrated: true });
        }
      })();
      return initialization;
    },
    setStatusFilter: (statusFilter) => set({ statusFilter }),
    toggleStatusFilter: () =>
      set({
        statusFilter: get().statusFilter === 'open' ? 'resolved' : 'open',
      }),
    toggleSavedCall: (call) => {
      if (!validCall(call)) return Promise.resolve(false);
      return persist(() => {
        const exists = get().isCallSaved(call.id);
        const metadata = { ...get().metadata };
        if (exists) delete metadata[call.id];
        else
          metadata[call.id] = {
            savedAt: new Date().toISOString(),
            checkedAt: new Date().toISOString(),
          };
        return {
          savedCalls: exists
            ? get().savedCalls.filter((c) => c.id !== call.id)
            : [snapshot(call), ...get().savedCalls],
          metadata,
        };
      });
    },
    clearSavedCalls: () => persist(() => ({ savedCalls: [], metadata: {} })),
    updateSnapshots: (calls) =>
      persist(() => {
        const current = new Map(calls.filter(validCall).map((c) => [c.id, c]));
        const metadata = { ...get().metadata };
        return {
          savedCalls: get().savedCalls.map((call) => {
            const fresh = current.get(call.id);
            if (!fresh) return call;
            metadata[call.id] = {
              ...metadata[call.id],
              checkedAt: new Date().toISOString(),
            };
            return snapshot(fresh);
          }),
          metadata,
        };
      }),
    isCallSaved: (id) => get().savedCalls.some((c) => c.id === id),
  };
});
