import { usePlacesStore } from '@/stores/placesStore';
import { useTerritoryFilterStore } from '@/stores/territoryFilterStore';

export { useTerritoryFilterStore };
import { toOfficialCallsParams } from './selection';
import { useShallow } from 'zustand/react/shallow';
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
