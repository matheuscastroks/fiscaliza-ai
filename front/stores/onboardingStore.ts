import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export const ONBOARDING_STORAGE_KEY = 'fiscaliza-ai:onboarding:v1';

interface OnboardingState {
  hydrated: boolean;
  completed: boolean;
  initialize: () => Promise<void>;
  complete: () => Promise<boolean>;
}

let initialization: Promise<void> | undefined;

/** Device preference, independent of accounts, logout and municipality changes. */
export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  hydrated: false,
  completed: false,
  initialize: () => {
    if (initialization) return initialization;
    initialization = (async () => {
      try {
        const saved = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        // A late read must never undo a completion made in this session.
        if (!get().completed) set({ completed: saved === 'done' });
      } catch {
        // The introduction remains available even when storage is unavailable.
      } finally {
        set({ hydrated: true });
      }
    })();
    return initialization;
  },
  complete: async () => {
    set({ completed: true });
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'done');
      return true;
    } catch {
      // Storage failures must not trap the person in an introduction loop.
      return false;
    }
  },
}));
