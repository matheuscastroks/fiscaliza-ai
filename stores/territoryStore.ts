import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { useNeighborhoods } from '@/features/territory/usePublicData';
import {
  resolveNeighborhood,
  type TerritoryLayer,
} from '@/features/territory/selectors';
import { create } from 'zustand';
const REGION_KEY = 'fiscaliza-ai:region:3304557:v1';
let initialization: Promise<void> | undefined;
let writes = Promise.resolve();
export const useTerritoryStore = create<{
  hydrated: boolean;
  persistenceError: string | null;
  preferredNeighborhood: string;
  initialize: () => Promise<void>;
  setPreferredNeighborhood: (name: string) => Promise<boolean>;
  neighborhood: string;
  setNeighborhood: (name: string) => void;
  layers: TerritoryLayer[];
  setLayers: (layers: TerritoryLayer[]) => void;
  isListView: boolean;
  setIsListView: (value: boolean) => void;
  toggleViewMode: () => void;
}>((set, get) => ({
  hydrated: false,
  persistenceError: null,
  preferredNeighborhood: '',
  neighborhood: '',
  layers: ['official'],
  isListView: false,
  initialize: () => {
    if (initialization) return initialization;
    initialization = (async () => {
      try {
        const raw = await AsyncStorage.getItem(REGION_KEY);
        if (!raw) return;
        const value = JSON.parse(raw);
        if (value.version !== 1 || typeof value.neighborhood !== 'string')
          throw Error('format');
        set({ preferredNeighborhood: value.neighborhood });
      } catch {
        set({
          persistenceError: 'Não foi possível ler sua região neste aparelho.',
        });
      } finally {
        set({ hydrated: true });
      }
    })();
    return initialization;
  },
  setPreferredNeighborhood: (name) => {
    let success = false;
    const result = writes.then(async () => {
      await get().initialize();
      try {
        const neighborhood = name.trim();
        await AsyncStorage.setItem(
          REGION_KEY,
          JSON.stringify({ version: 1, neighborhood }),
        );
        set({ preferredNeighborhood: neighborhood, persistenceError: null });
        success = true;
      } catch {
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
}));
export function useTerritorySelection() {
  const neighborhood = useTerritoryStore((s) => s.neighborhood);
  const set = useTerritoryStore((s) => s.setNeighborhood);
  const setNeighborhood = useCallback((value: string) => set(value), [set]);
  const boundaries = useNeighborhoods();
  const neighborhoodId = resolveNeighborhood(
    neighborhood,
    boundaries.data || [],
  )?.id;
  return { neighborhood, neighborhoodId, setNeighborhood };
}
export function useTerritoryViewMode() {
  const isListView = useTerritoryStore((s) => s.isListView);
  const setIsListView = useTerritoryStore((s) => s.setIsListView);
  const toggleViewMode = useTerritoryStore((s) => s.toggleViewMode);
  return { isListView, setIsListView, toggleViewMode };
}
