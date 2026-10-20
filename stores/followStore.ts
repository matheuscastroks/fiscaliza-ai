import { create } from 'zustand';

interface FollowStore {
  onlyMine: boolean;
  toggleOnlyMine: () => void;
  setOnlyMine: (value: boolean) => void;
}

export const useFollowStore = create<FollowStore>((set) => ({
  onlyMine: false,
  toggleOnlyMine: () => set((state) => ({ onlyMine: !state.onlyMine })),
  setOnlyMine: (value: boolean) => set({ onlyMine: value }),
}));
