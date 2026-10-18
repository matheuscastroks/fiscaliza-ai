import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface AvatarState {
  photos: Record<string, string | null>;
  load: (userId: string) => Promise<void>;
  save: (userId: string, uri: string) => Promise<void>;
}

const key = (userId: string) => `fiscaliza-avatar:${userId}`;

/** Device-local photos, isolated by account; never substitute another person's portrait. */
export const useAvatarStore = create<AvatarState>((set, get) => ({
  photos: {},
  load: async (userId) => {
    if (get().photos[userId] !== undefined) return;
    const uri = await AsyncStorage.getItem(key(userId));
    set((state) => ({
      photos:
        state.photos[userId] === undefined
          ? { ...state.photos, [userId]: uri }
          : state.photos,
    }));
  },
  save: async (userId, uri) => {
    await AsyncStorage.setItem(key(userId), uri);
    set((state) => ({ photos: { ...state.photos, [userId]: uri } }));
  },
}));
