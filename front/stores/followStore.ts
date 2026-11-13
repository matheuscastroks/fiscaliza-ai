import AsyncStorage from '@react-native-async-storage/async-storage';

import { create } from 'zustand';

import { createScopeGeneration, createWriteQueue } from './scopedPersistence';
import type { OfficialCall, SavedCallItem } from '@/shared/contracts';

import { DEFAULT_MUNICIPALITY_ID } from '@/features/city/municipalityId';


let onFollowChanged: ((call: OfficialCall, saved: boolean) => void) | undefined;
export function setFollowNotificationListener(
  listener?: (call: OfficialCall, saved: boolean) => void,
) {
  onFollowChanged = listener;
}

/**
 * Chamados salvos pertencem à conta: o servidor guarda a lista e o aparelho
 * guarda uma cópia para abrir sem internet. A ponte com a API é injetada para o
 * store continuar testável sem rede.
 */
export interface SavedCallsAccountApi {
  list: () => Promise<SavedCallItem[]>;
  merge: (ids: string[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}
let accountApi: SavedCallsAccountApi | undefined;
export function setSavedCallsAccountApi(api?: SavedCallsAccountApi) {
  accountApi = api;
}
/** O que mudou neste aparelho e ainda não chegou à conta. */
export interface PendingChanges {
  clear: boolean;
  add: string[];
  remove: string[];
}
const noPending = (): PendingChanges => ({ clear: false, add: [], remove: [] });
function readPending(value: unknown): PendingChanges {
  const v = (value ?? {}) as Partial<PendingChanges>;
  const ids = (list: unknown) =>
    Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  return { clear: v.clear === true, add: ids(v.add), remove: ids(v.remove) };
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
  pending: PendingChanges;
  initialize: () => Promise<void>;
  /** Envia o que está pendente e traz a lista da conta. Falso se não deu (sem conta, sem internet). */
  syncWithAccount: () => Promise<boolean>;
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
  pending?: PendingChanges;
  /** Alertas aplicados somente depois de a gravação ser confirmada. */
  effects?: { call: OfficialCall; saved: boolean }[];
}
let initialization: Promise<void> | undefined;
const enqueueWrite = createWriteQueue();
/** Troca de escopo invalida operações de outra geração. */
const scope = createScopeGeneration();
let syncing: Promise<boolean> | undefined;
export const useFollowStore = create<FollowStore>((set, get) => {
  /** Salvos feitos antes do login passam para a conta uma única vez. */
  const adoptAnonymousList = async (
    municipalityId: string,
    generation: number,
  ) => {
    const anonymousKey = followStorageKey(null, municipalityId);
    try {
      const raw = await AsyncStorage.getItem(anonymousKey);
      if (!raw || !scope.isCurrent(generation)) return;
      const document = JSON.parse(raw);
      const found: OfficialCall[] = (Array.isArray(document.items) ? document.items : [])
        .map((entry: { call?: unknown }) => entry?.call)
        .filter((call: unknown): call is OfficialCall => validCall(call, municipalityId));
      const fresh = found.filter((call) => !get().isCallSaved(call.id));
      if (fresh.length > 0) {
        const adopted = await persist(() => {
          const metadata = { ...get().metadata };
          const pending = { ...get().pending };
          const stamp = new Date().toISOString();
          for (const call of fresh) metadata[call.id] = { savedAt: stamp, checkedAt: stamp };
          pending.add = [...new Set([...pending.add, ...fresh.map((c) => c.id)])];
          return {
            savedCalls: [...fresh.map(snapshot), ...get().savedCalls],
            metadata,
            pending,
          };
        });
        if (!adopted) return;
      }
      await AsyncStorage.removeItem(anonymousKey);
    } catch {
      // A lista anônima continua no aparelho; tentamos de novo no próximo login.
    }
  };
  const persist = (change: () => PersistChange) => {
    const generation = scope.current();
    const scopeUserId = get().userId;
    const scopeMunicipalityId = get().municipalityId;
    const inScope = () =>
      scope.isCurrent(generation) &&
      get().userId === scopeUserId &&
      get().municipalityId === scopeMunicipalityId;
    return enqueueWrite(async () => {
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
            pending: next.pending ?? get().pending,
          }),
        );
        // A conta ou o município mudou durante a gravação: o resultado
        // pertence ao escopo anterior e não pode alterar o estado atual.
        if (!inScope()) return false;
        set({
          savedCalls: next.savedCalls,
          metadata: next.metadata,
          pending: next.pending ?? get().pending,
          persistenceError: null,
        });
        for (const effect of next.effects ?? []) {
          onFollowChanged?.(effect.call, effect.saved);
        }
        if (scopeUserId && accountApi) void get().syncWithAccount();
        return true;
      } catch {
        if (inScope()) {
          set({
            persistenceError:
              'Não conseguimos guardar os chamados salvos na sua conta. Tente de novo.',
          });
        }
        return false;
      } finally {
        set({ busy: false });
      }
    });
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
    pending: noPending(),
    syncWithAccount: () => {
      // Uma conversa com o servidor por vez; pedidos novos esperam a anterior.
      const previous = syncing ?? Promise.resolve(false);
      const current: Promise<boolean> = previous.then(async () => {
        const api = accountApi;
        const scopeUserId = get().userId;
        if (!api || !scopeUserId) return false;
        const generation = scope.current();
        const scopeMunicipalityId = get().municipalityId;
        const inScope = () =>
          scope.isCurrent(generation) &&
          get().userId === scopeUserId &&
          get().municipalityId === scopeMunicipalityId;
        await get().initialize();
        if (!inScope()) return false;
        const sent = get().pending;
        let items: { call: OfficialCall; savedAt: string }[];
        try {
          if (sent.clear) await api.clear();
          for (const id of sent.remove) await api.remove(id);
          if (sent.add.length) await api.merge(sent.add);
          items = await api.list();
        } catch {
          return false; // sem internet ou erro do servidor: tenta de novo depois
        }
        return enqueueWrite(async () => {
          if (!inScope()) return false;
          // Mudanças feitas durante a conversa com o servidor continuam pendentes.
          const now = get().pending;
          const pending: PendingChanges = {
            clear: now.clear && !sent.clear,
            add: now.add.filter((id) => !sent.add.includes(id)),
            remove: now.remove.filter((id) => !sent.remove.includes(id)),
          };
          const local = new Map(get().savedCalls.map((c) => [c.id, c]));
          const merged = new Map<string, OfficialCall>();
          const metadata: Record<string, SavedMeta> = {};
          const stamp = new Date().toISOString();
          for (const item of items) {
            if (!validCall(item.call, scopeMunicipalityId)) continue;
            if (pending.remove.includes(item.call.id) || pending.clear) continue;
            merged.set(item.call.id, snapshot(item.call));
            metadata[item.call.id] = {
              savedAt: item.savedAt,
              checkedAt: get().metadata[item.call.id]?.checkedAt ?? stamp,
            };
          }
          for (const id of pending.add) {
            const call = local.get(id);
            if (!call || merged.has(id)) continue;
            merged.set(id, call);
            metadata[id] = get().metadata[id] ?? { savedAt: stamp, checkedAt: stamp };
          }
          const savedCalls = [...merged.values()].sort((a, b) =>
            metadata[b.id].savedAt.localeCompare(metadata[a.id].savedAt),
          );
          try {
            await AsyncStorage.setItem(
              followStorageKey(scopeUserId, scopeMunicipalityId),
              JSON.stringify({
                version: 1,
                items: savedCalls.map((call) => ({ call, ...metadata[call.id] })),
                pending,
              }),
            );
          } catch {
            return false;
          }
          if (!inScope()) return false;
          set({ savedCalls, metadata, pending, persistenceError: null });
          return true;
        });
      });
      syncing = current;
      void current.finally(() => {
        if (syncing === current) syncing = undefined;
      });
      return current;
    },
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
            set({
              savedCalls: [...calls.values()],
              metadata,
              pending: readPending(document.pending),
            });
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
      scope.next();
      set({
        userId,
        municipalityId: nextMunicipalityId,
        hydrated: false,
        persistenceError: null,
        savedCalls: [],
        metadata: {},
        pending: noPending(),
      });
      const generation = scope.current();
      return get()
        .initialize()
        .then(async () => {
          if (!userId || !accountApi || !scope.isCurrent(generation)) return;
          await adoptAnonymousList(nextMunicipalityId, generation);
          if (scope.isCurrent(generation)) await get().syncWithAccount();
        });
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
        const pending = { ...get().pending };
        if (exists) {
          delete metadata[call.id];
          pending.add = pending.add.filter((id) => id !== call.id);
          pending.remove = [...new Set([...pending.remove, call.id])];
        } else {
          metadata[call.id] = {
            savedAt: new Date().toISOString(),
            checkedAt: new Date().toISOString(),
          };
          pending.remove = pending.remove.filter((id) => id !== call.id);
          pending.add = [...new Set([...pending.add, call.id])];
        }
        return {
          pending,
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
        pending: { clear: true, add: [], remove: [] },
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
