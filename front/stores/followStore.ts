import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { OfficialCall } from '@/shared/contracts';
import { DEFAULT_MUNICIPALITY_ID } from '@/features/city/municipalityId';

let onFollowChanged: ((call: OfficialCall, saved: boolean) => void) | undefined;
export function setFollowNotificationListener(
  listener?: (call: OfficialCall, saved: boolean) => void,
) {
  onFollowChanged = listener;
}

export const FOLLOW_STORAGE_KEY = `fiscaliza-ai:saved:rio1746:${DEFAULT_MUNICIPALITY_ID}:v1`;
export function followStorageKey(
  userId?: string | null,
  municipalityId = DEFAULT_MUNICIPALITY_ID,
): string {
  return userId
    ? `fiscaliza-ai:saved:rio1746:${userId}:${municipalityId}:v1`
    : `fiscaliza-ai:saved:rio1746:${municipalityId}:v1`;
}
export type FollowStatusFilter = 'all' | 'open' | 'resolved' | 'saved';
interface SavedMeta {
  savedAt: string;
  checkedAt: string;
}
interface FollowStore {
  userId: string | null;
  municipalityId: string;
  hydrated: boolean;
  busy: boolean;
  persistenceError: string | null;
  statusFilter: FollowStatusFilter;
  savedCalls: OfficialCall[];
  metadata: Record<string, SavedMeta>;
  initialize: () => Promise<void>;
  setScope: (userId: string | null, municipalityId?: string) => Promise<void>;
  setStatusFilter: (value: FollowStatusFilter) => void;
  toggleStatusFilter: () => void;
  toggleSavedCall: (call: OfficialCall) => Promise<boolean>;
  clearSavedCalls: () => Promise<boolean>;
  updateSnapshots: (calls: OfficialCall[]) => Promise<boolean>;
  isCallSaved: (id: string) => boolean;
}
function validCall(
  value: unknown,
  municipalityId = DEFAULT_MUNICIPALITY_ID,
): value is OfficialCall {
  if (!value || typeof value !== 'object') return false;
  const c = value as OfficialCall;
  return (
    c.source === 'rio1746' &&
    c.municipalityId === municipalityId &&
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
    serviceCategory,
    serviceType,
    serviceSubtype,
    organizationName,
    officialStatus,
    officialSituation,
    officialSituationType,
    statusJustification,
    openedAt,
    closedAt,
    targetDate,
    diagnosisTargetDate,
    withinDeadline,
    timeRemaining,
    timeUnit,
    deadlineType,
    complaintsCount,
    streetName,
    neighborhoodId,
    neighborhoodName,
    subprefecture,
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
    serviceCategory,
    serviceType,
    serviceSubtype,
    organizationName,
    officialStatus,
    officialSituation,
    officialSituationType,
    statusJustification,
    openedAt,
    closedAt,
    targetDate,
    diagnosisTargetDate,
    withinDeadline,
    timeRemaining,
    timeUnit,
    deadlineType,
    complaintsCount,
    streetName,
    neighborhoodId,
    neighborhoodName,
    subprefecture,
    latitude,
    longitude,
    importedAt,
    updatedAt,
    sourcePartitionDate,
  };
}
interface PersistChange {
  savedCalls: OfficialCall[];
  metadata: Record<string, SavedMeta>;
  /** Alertas aplicados somente depois de a gravação ser confirmada. */
  effects?: { call: OfficialCall; saved: boolean }[];
}
let initialization: Promise<void> | undefined;
let queue = Promise.resolve();
/** Incrementa a cada troca de escopo; operações de outra geração são descartadas. */
let scopeGeneration = 0;
export const useFollowStore = create<FollowStore>((set, get) => {
  const persist = (change: () => PersistChange) => {
    const generation = scopeGeneration;
    const scopeUserId = get().userId;
    const scopeMunicipalityId = get().municipalityId;
    const inScope = () =>
      generation === scopeGeneration &&
      get().userId === scopeUserId &&
      get().municipalityId === scopeMunicipalityId;
    const result = queue.then(async () => {
      if (!inScope()) return false;
      await get().initialize();
      if (!inScope()) return false;
      const key = followStorageKey(scopeUserId, scopeMunicipalityId);
      set({ busy: true });
      try {
        const next = change();
        await AsyncStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            items: next.savedCalls.map((call) => ({
              call: snapshot(call),
              ...next.metadata[call.id],
            })),
          }),
        );
        // A conta ou o município mudou durante a gravação: o resultado
        // pertence ao escopo anterior e não pode alterar o estado atual.
        if (!inScope()) return false;
        set({
          savedCalls: next.savedCalls,
          metadata: next.metadata,
          persistenceError: null,
        });
        for (const effect of next.effects ?? []) {
          onFollowChanged?.(effect.call, effect.saved);
        }
        return true;
      } catch {
        if (inScope()) {
          set({
            persistenceError:
              'Não foi possível gravar os chamados salvos na sua conta. Tente novamente.',
          });
        }
        return false;
      } finally {
        set({ busy: false });
      }
    });
    queue = result.then(() => undefined);
    return result;
  };
  return {
    userId: null,
    municipalityId: DEFAULT_MUNICIPALITY_ID,
    hydrated: false,
    busy: false,
    persistenceError: null,
    statusFilter: 'all',
    savedCalls: [],
    metadata: {},
    initialize: () => {
      if (initialization) return initialization;
      const scopeUserId = get().userId;
      const scopeMunicipalityId = get().municipalityId;
      const key = followStorageKey(scopeUserId, scopeMunicipalityId);
      initialization = (async () => {
        try {
          const raw = await AsyncStorage.getItem(key);
          if (!raw) return;
          const document = JSON.parse(raw);
          if (document.version !== 1 || !Array.isArray(document.items))
            throw Error('format');
          const calls = new Map<string, OfficialCall>();
          const metadata: Record<string, SavedMeta> = {};
          for (const entry of document.items) {
            if (!validCall(entry?.call, scopeMunicipalityId)) continue;
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
          if (
            get().userId === scopeUserId &&
            get().municipalityId === scopeMunicipalityId
          ) {
            set({ savedCalls: [...calls.values()], metadata });
          }
        } catch {
          if (
            get().userId === scopeUserId &&
            get().municipalityId === scopeMunicipalityId
          ) {
            set({
              persistenceError:
                'Não conseguimos abrir seus chamados salvos. Feche e abra o app de novo.',
            });
          }
        } finally {
          if (
            get().userId === scopeUserId &&
            get().municipalityId === scopeMunicipalityId
          ) {
            set({ hydrated: true });
          }
        }
      })();
      return initialization;
    },
    setScope: (userId, municipalityId = DEFAULT_MUNICIPALITY_ID) => {
      const nextMunicipalityId = municipalityId || DEFAULT_MUNICIPALITY_ID;
      if (
        get().userId === userId &&
        get().municipalityId === nextMunicipalityId &&
        initialization
      ) {
        return initialization;
      }
      initialization = undefined;
      scopeGeneration += 1;
      set({
        userId,
        municipalityId: nextMunicipalityId,
        hydrated: false,
        persistenceError: null,
        savedCalls: [],
        metadata: {},
      });
      return get().initialize();
    },
    setStatusFilter: (statusFilter) => set({ statusFilter }),
    toggleStatusFilter: () =>
      set({
        statusFilter: get().statusFilter === 'open' ? 'resolved' : 'open',
      }),
    toggleSavedCall: (call) => {
      if (!validCall(call, get().municipalityId)) return Promise.resolve(false);
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
          effects: [{ call, saved: !exists }],
        };
      });
    },
    clearSavedCalls: () =>
      persist(() => ({
        savedCalls: [],
        metadata: {},
        effects: get().savedCalls.map((call) => ({ call, saved: false })),
      })),
    updateSnapshots: (calls) =>
      persist(() => {
        const municipalityId = get().municipalityId;
        const current = new Map(
          calls
            .filter((c) => validCall(c, municipalityId))
            .map((c) => [c.id, c]),
        );
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
