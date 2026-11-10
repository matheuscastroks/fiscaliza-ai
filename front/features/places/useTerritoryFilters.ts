import { create } from 'zustand';
import { usePlacesStore } from '@/stores/placesStore';
import { toOfficialCallsParams } from './selection';
import { useShallow } from 'zustand/react/shallow';
import { OPEN_STATUS } from '@/features/city/callStatus';
type Filters = { search: string; macroTheme: string; serviceType: string; status: string; period: string };
export const useTerritoryFilterStore = create<Filters & { setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void }>((set) => ({
  search: '', macroTheme: 'all', serviceType: 'all', status: OPEN_STATUS, period: 'all',
  setFilter: (key, value) => set({ [key]: value }),
}));
export function useTerritoryFilters() {
  const state = useTerritoryFilterStore();
  const { selection, userId, municipalityId, hydrated } = usePlacesStore(useShallow((s) => ({ selection: s.selection, userId: s.userId, municipalityId: s.municipalityId, hydrated: s.hydrated })));
  return { ...state, selection, hydrated: hydrated && selection.kind !== 'pending-current', cacheScope: `${userId || 'anonymous'}:${municipalityId}`, params: {
    ...toOfficialCallsParams(selection), search: state.search.trim() || undefined,
    tipo: state.serviceType === 'all' ? undefined : state.serviceType,
    tema: state.macroTheme === 'all' ? undefined : state.macroTheme,
    situacao: state.status === 'all' ? undefined : state.status,
    periodDays: state.period === 'all' ? undefined : Number(state.period),
  } };
}
