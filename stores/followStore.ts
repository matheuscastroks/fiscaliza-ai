import { create } from 'zustand';
import type { OfficialCall } from '@/shared/contracts';

export type FollowStatusFilter = 'open' | 'resolved' | 'saved';

interface FollowStore {
  statusFilter: FollowStatusFilter;
  savedCalls: OfficialCall[];
  toggleStatusFilter: () => void;
  setStatusFilter: (value: FollowStatusFilter) => void;
  toggleSavedCall: (call: OfficialCall) => void;
  isCallSaved: (id: string) => boolean;
}

export const useFollowStore = create<FollowStore>((set, get) => ({
  statusFilter: 'open',
  savedCalls: [],
  toggleStatusFilter: () =>
    set((state) => ({
      statusFilter: state.statusFilter === 'open' ? 'resolved' : 'open',
    })),
  setStatusFilter: (value: FollowStatusFilter) => set({ statusFilter: value }),
  toggleSavedCall: (call: OfficialCall) =>
    set((state) => {
      const exists = state.savedCalls.some((c) => c.id === call.id);
      return {
        savedCalls: exists
          ? state.savedCalls.filter((c) => c.id !== call.id)
          : [call, ...state.savedCalls],
      };
    }),
  isCallSaved: (id: string) => get().savedCalls.some((c) => c.id === id),
}));
