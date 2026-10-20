import { useCallback } from 'react';
import { create } from 'zustand';
import { useAuthStore } from './authStore';

const useTerritoryStore = create<{
  key: string;
  neighborhood: string | undefined;
  isListView: boolean;
  setIsListView: (value: boolean) => void;
  toggleViewMode: () => void;
}>((set) => ({
  key: '',
  neighborhood: undefined,
  isListView: false,
  setIsListView: (value: boolean) => set({ isListView: value }),
  toggleViewMode: () => set((state) => ({ isListView: !state.isListView })),
}));
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
    useTerritoryStore.setState({
      key: scopeKey(),
      neighborhood: undefined,
      isListView: false,
    });
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

export function useTerritoryViewMode(): {
  isListView: boolean;
  setIsListView: (value: boolean) => void;
  toggleViewMode: () => void;
} {
  const isListView = useTerritoryStore((state) => state.isListView);
  const setIsListView = useCallback((value: boolean) => {
    useTerritoryStore.setState({ isListView: value });
  }, []);
  const toggleViewMode = useCallback(() => {
    useTerritoryStore.setState((state) => ({ isListView: !state.isListView }));
  }, []);
  return { isListView, setIsListView, toggleViewMode };
}

export { useTerritoryStore };
