import { useCallback } from 'react';
import { create } from 'zustand';
import { useAuthStore } from './authStore';

const useTerritoryStore = create<{
  key: string;
  neighborhood: string | undefined;
}>(() => ({ key: '', neighborhood: undefined }));
const scopeKey = () => {
  const user = useAuthStore.getState().user;
  return user?.id && user.municipality?.id
    ? user.id + ':' + user.municipality.id
    : '';
};
useAuthStore.subscribe((next, previous) => {
  if (
    next.user?.id !== previous.user?.id ||
    next.user?.municipality?.id !== previous.user?.municipality?.id ||
    !next.isAuthenticated
  ) {
    useTerritoryStore.setState({ key: scopeKey(), neighborhood: undefined });
  }
});

export function useTerritorySelection(): {
  neighborhood: string;
  setNeighborhood: (value: string) => void;
} {
  const user = useAuthStore((state) => state.user);
  const key =
    user?.id && user.municipality?.id
      ? user.id + ':' + user.municipality.id
      : '';
  const storedKey = useTerritoryStore((state) => state.key);
  const stored = useTerritoryStore((state) => state.neighborhood);
  const neighborhood =
    key && storedKey === key && stored !== undefined ? stored : '';
  const setNeighborhood = useCallback(
    (value: string) => {
      if (key && key === scopeKey())
        useTerritoryStore.setState({ key, neighborhood: value.trim() });
    },
    [key],
  );
  return { neighborhood, setNeighborhood };
}
