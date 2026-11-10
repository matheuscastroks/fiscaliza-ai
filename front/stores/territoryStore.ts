import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useMemo } from 'react';
import { useNeighborhoods } from '@/features/territory/usePublicData';
import {
  resolveNeighborhood,
  type TerritoryLayer,
} from '@/features/territory/selectors';
import { create } from 'zustand';
import { usePlacesStore } from './placesStore';
import { createScopeGeneration, createWriteQueue } from './scopedPersistence';
import { DEFAULT_MUNICIPALITY_ID } from '@/features/city/municipalityId';
const REGION_KEY = `fiscaliza-ai:region:${DEFAULT_MUNICIPALITY_ID}:v1`;
export function regionStorageKey(
  userId?: string | null,
  municipalityId = DEFAULT_MUNICIPALITY_ID,
): string {
  return userId
    ? `fiscaliza-ai:region:${userId}:${municipalityId}:v1`
    : REGION_KEY;
}
let initialization: Promise<void> | undefined;
const enqueueWrite = createWriteQueue();
const scope = createScopeGeneration();
export type TerritoryDomain = 'calls' | 'facilities';

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
  layers: TerritoryLayer[];
  setLayers: (layers: TerritoryLayer[]) => void;
  territoryDomain: TerritoryDomain;
  savedFacilityLayers: TerritoryLayer[];
  setTerritoryDomain: (domain: TerritoryDomain) => void;
  setFacilityLayers: (layers: TerritoryLayer[]) => void;
  isListView: boolean;
  setIsListView: (value: boolean) => void;
  toggleViewMode: () => void;
  filtersOpen: boolean;
  setFiltersOpen: (value: boolean) => void;
}>((set, get) => ({
  userId: null,
  municipalityId: DEFAULT_MUNICIPALITY_ID,
  hydrated: false,
  persistenceError: null,
  preferredNeighborhood: '',
  layers: ['official'],
  territoryDomain: 'calls',
  savedFacilityLayers: ['school', 'health', 'square'],
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
  setScope: (userId, municipalityId = DEFAULT_MUNICIPALITY_ID, defaultNeighborhood = '') => {
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
      preferredNeighborhood: defaultNeighborhood.trim(),
      isListView: false,
    });
    return get().initialize();
  },
  setPreferredNeighborhood: (name) => {
    let success = false;
    const requestedScope = scope.current();
    const { userId, municipalityId } = get();
    const key = regionStorageKey(userId, municipalityId);
    return enqueueWrite(async () => {
      if (!scope.isCurrent(requestedScope)) return;
      await get().initialize();
      if (!scope.isCurrent(requestedScope)) return;
      try {
        const neighborhood = name.trim();
        await AsyncStorage.setItem(
          key,
          JSON.stringify({ version: 1, neighborhood }),
        );
        if (!scope.isCurrent(requestedScope)) return;
        set({ preferredNeighborhood: neighborhood, persistenceError: null });
        const places = usePlacesStore.getState();
        if (places.userId === userId && places.municipalityId === municipalityId) await places.selectNeighborhood(neighborhood);
        success = true;
      } catch {
        if (!scope.isCurrent(requestedScope)) return;
        set({
          persistenceError:
            'Não foi possível salvar sua região. Tente novamente.',
        });
      }
    }).then(() => success);
  },
  setLayers: (layers) => set({ layers }),
  setTerritoryDomain: (domain) => {
    if (domain === 'calls') {
      set({ territoryDomain: 'calls', layers: ['official'] });
    } else {
      const saved: TerritoryLayer[] =
        get().savedFacilityLayers.length > 0
          ? get().savedFacilityLayers
          : ['school', 'health', 'square'];
      set({ territoryDomain: 'facilities', layers: saved });
    }
  },
  setFacilityLayers: (facilityLayers) => {
    const sanitized = facilityLayers.filter(
      (l): l is 'school' | 'health' | 'square' => l !== 'official',
    );
    const nextSaved: TerritoryLayer[] =
      sanitized.length > 0 ? sanitized : ['school'];
    set({
      savedFacilityLayers: nextSaved,
      ...(get().territoryDomain === 'facilities' ? { layers: nextSaved } : {}),
    });
  },
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
export function useTerritoryDomain() {
  const territoryDomain = useTerritoryStore((s) => s.territoryDomain);
  const setTerritoryDomain = useTerritoryStore((s) => s.setTerritoryDomain);
  const savedFacilityLayers = useTerritoryStore((s) => s.savedFacilityLayers);
  const setFacilityLayers = useTerritoryStore((s) => s.setFacilityLayers);
  return {
    territoryDomain,
    setTerritoryDomain,
    savedFacilityLayers,
    setFacilityLayers,
  };
}
