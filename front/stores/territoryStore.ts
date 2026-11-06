import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useMemo } from 'react';
import { useNeighborhoods } from '@/features/territory/usePublicData';
import {
  resolveNeighborhood,
  type TerritoryLayer,
} from '@/features/territory/selectors';
import { create } from 'zustand';
import { usePlacesStore } from './placesStore';
const REGION_KEY = 'fiscaliza-ai:region:3304557:v1';
export function regionStorageKey(
  userId?: string | null,
  municipalityId = '3304557',
): string {
  return userId
    ? `fiscaliza-ai:region:${userId}:${municipalityId}:v1`
    : REGION_KEY;
}
let initialization: Promise<void> | undefined;
let writes = Promise.resolve();
let scopeVersion = 0;
export const useTerritoryStore = create<{
  userId: string | null;
  municipalityId: string;
  hydrated: boolean;
  persistenceError: string | null;
  preferredNeighborhood: string;
  initialize: () => Promise<void>;
  setScope: (
    userId: string | null,
    municipalityId?: string,
    defaultNeighborhood?: string,
  ) => Promise<void>;
  setPreferredNeighborhood: (name: string) => Promise<boolean>;
  neighborhood: string;
  setNeighborhood: (name: string) => void;
  layers: TerritoryLayer[];
  setLayers: (layers: TerritoryLayer[]) => void;
  isListView: boolean;
  setIsListView: (value: boolean) => void;
  toggleViewMode: () => void;
  filtersOpen: boolean;
  setFiltersOpen: (value: boolean) => void;
}>((set, get) => ({
  userId: null,
  municipalityId: '3304557',
  hydrated: false,
  persistenceError: null,
  preferredNeighborhood: '',
  neighborhood: '',
  layers: ['official'],
  isListView: false,
  filtersOpen: false,
  initialize: () => {
    if (initialization) return initialization;
    const scopeUserId = get().userId;
    const scopeMunicipalityId = get().municipalityId;
    const key = regionStorageKey(scopeUserId, scopeMunicipalityId);
    initialization = (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) return;
        const value = JSON.parse(raw);
        if (value.version !== 1 || typeof value.neighborhood !== 'string')
          throw Error('format');
        if (
          get().userId === scopeUserId &&
          get().municipalityId === scopeMunicipalityId
        ) {
          set({ preferredNeighborhood: value.neighborhood });
        }
      } catch {
        if (
          get().userId === scopeUserId &&
          get().municipalityId === scopeMunicipalityId
        ) {
          set({
            persistenceError: 'Não foi possível ler sua região na sua conta.',
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
  setScope: (userId, municipalityId = '3304557', defaultNeighborhood = '') => {
    const nextMunicipalityId = municipalityId || '3304557';
    if (
      get().userId === userId &&
      get().municipalityId === nextMunicipalityId &&
      initialization
    ) {
      return initialization;
    }
    initialization = undefined;
    scopeVersion++;
    set({
      userId,
      municipalityId: nextMunicipalityId,
      hydrated: false,
      persistenceError: null,
      preferredNeighborhood: defaultNeighborhood.trim(),
      neighborhood: '',
      isListView: false,
    });
    return get().initialize();
  },
  setPreferredNeighborhood: (name) => {
    let success = false;
    const requestedScope = scopeVersion;
    const { userId, municipalityId } = get();
    const key = regionStorageKey(userId, municipalityId);
    const result = writes.then(async () => {
      if (requestedScope !== scopeVersion) return;
      await get().initialize();
      if (requestedScope !== scopeVersion) return;
      try {
        const neighborhood = name.trim();
        await AsyncStorage.setItem(
          key,
          JSON.stringify({ version: 1, neighborhood }),
        );
        if (requestedScope !== scopeVersion) return;
        set({ preferredNeighborhood: neighborhood, persistenceError: null });
        const places = usePlacesStore.getState();
        if (places.userId === userId && places.municipalityId === municipalityId) await places.selectNeighborhood(neighborhood);
        success = true;
      } catch {
        if (requestedScope !== scopeVersion) return;
        set({
          persistenceError:
            'Não foi possível salvar sua região. Tente novamente.',
        });
      }
    });
    writes = result;
    return result.then(() => success);
  },
  setNeighborhood: (name) => set({ neighborhood: name.trim() }),
  setLayers: (layers) => set({ layers }),
  setIsListView: (isListView) => set({ isListView }),
  toggleViewMode: () => set({ isListView: !get().isListView }),
  setFiltersOpen: (filtersOpen) => set({ filtersOpen }),
}));
export function useTerritorySelection() {
  const selection = usePlacesStore((s) => s.selection);
  const neighborhood = selection.kind === 'neighborhood' ? selection.name : '';
  const setNeighborhood = useCallback((value: string) => { void usePlacesStore.getState().selectNeighborhood(value); }, []);
  const boundaries = useNeighborhoods();
  const neighborhoodId = useMemo(
    () => selection.kind === 'neighborhood' && selection.id ? selection.id : resolveNeighborhood(neighborhood, boundaries.data || [])?.id,
    [selection, neighborhood, boundaries.data],
  );
  return { neighborhood, neighborhoodId, setNeighborhood };
}
export function useTerritoryViewMode() {
  const isListView = useTerritoryStore((s) => s.isListView);
  const setIsListView = useTerritoryStore((s) => s.setIsListView);
  const toggleViewMode = useTerritoryStore((s) => s.toggleViewMode);
  return { isListView, setIsListView, toggleViewMode };
}
export function useTerritoryFiltersModal() {
  const filtersOpen = useTerritoryStore((s) => s.filtersOpen);
  const setFiltersOpen = useTerritoryStore((s) => s.setFiltersOpen);
  return { filtersOpen, setFiltersOpen };
}
