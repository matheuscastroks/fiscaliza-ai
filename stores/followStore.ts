import { create } from 'zustand';

export type FollowStatusFilter = 'open' | 'resolved';

interface FollowStore {
  statusFilter: FollowStatusFilter;
  toggleStatusFilter: () => void;
  setStatusFilter: (value: FollowStatusFilter) => void;
}

export const useFollowStore = create<FollowStore>((set) => ({
  statusFilter: 'open',
  toggleStatusFilter: () =>
    set((state) => ({
      statusFilter: state.statusFilter === 'open' ? 'resolved' : 'open',
    })),
  setStatusFilter: (value: FollowStatusFilter) => set({ statusFilter: value }),
}));
