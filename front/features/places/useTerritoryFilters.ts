import { create } from 'zustand';
import { usePlacesStore } from '@/stores/placesStore';
import { toOfficialCallsParams } from './selection';
type Filters = { search: string; macroTheme: string; serviceType: string; status: string; period: string };
export const useTerritoryFilterStore = create<Filters & { setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void }>((set) => ({
  search: '', macroTheme: 'all', serviceType: 'all', status: 'Não Encerrado', period: 'all',
  setFilter: (key, value) => set({ [key]: value }),
}));
export function useTerritoryFilters() {
  const state = useTerritoryFilterStore();
  const { selection, userId, municipalityId, hydrated } = usePlacesStore();
  return { ...state, selection, hydrated: hydrated && selection.kind !== 'pending-current', cacheScope: `${userId || 'anonymous'}:${municipalityId}`, params: {
    ...toOfficialCallsParams(selection), search: state.search.trim() || undefined,
    tipo: state.serviceType === 'all' ? undefined : state.serviceType,
    tema: state.macroTheme === 'all' ? undefined : state.macroTheme,
    situacao: state.status === 'all' ? undefined : state.status,
    periodDays: state.period === 'all' ? undefined : Number(state.period),
  } };
}
