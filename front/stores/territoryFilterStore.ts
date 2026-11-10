import { create } from 'zustand';
import { OPEN_STATUS } from '@/features/city/callStatus';

export type TerritoryFilters = {
  search: string;
  macroTheme: string;
  serviceType: string;
  status: string;
  period: string;
};

export const initialTerritoryFilters: TerritoryFilters = {
  search: '',
  macroTheme: 'all',
  serviceType: 'all',
  status: OPEN_STATUS,
  period: 'all',
};

/** Filtros da exploração: só em memória, e zerados ao trocar de usuário ou município. */
export const useTerritoryFilterStore = create<
  TerritoryFilters & {
    setFilter: <K extends keyof TerritoryFilters>(key: K, value: TerritoryFilters[K]) => void;
    reset: () => void;
  }
>((set) => ({
  ...initialTerritoryFilters,
  setFilter: (key, value) => set({ [key]: value }),
  reset: () => set({ ...initialTerritoryFilters }),
}));
