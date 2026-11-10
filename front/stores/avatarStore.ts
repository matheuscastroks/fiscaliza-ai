import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { mutation, uploadImage } from '@/services/http';
import { useAuthStore } from './authStore';
import type { SessionUser } from '@/shared/contracts';

interface AvatarState {
  photos: Record<string, string | null>;
  load: (userId: string) => Promise<void>;
  save: (userId: string, uri: string) => Promise<void>;
}

const key = (userId: string) => `fiscaliza-avatar:${userId}`;
const pendingLoads = new Map<string, Promise<void>>();

/** The server profile is canonical. Local legacy photos are migrated once online. */
export const useAvatarStore = create<AvatarState>((set, get) => ({
  photos: {},
  load: async (userId) => {
    const pending = pendingLoads.get(userId);
    if (pending) return pending;
    if (get().photos[userId] !== undefined) return;
    const loading = (async () => {
      let uri: string | null = null;
      try {
        uri = await AsyncStorage.getItem(key(userId));
      } catch {
        // Foto local ilegível: segue com o avatar do perfil do servidor.
      }
      set((state) => ({
        photos:
          state.photos[userId] === undefined
            ? { ...state.photos, [userId]: uri }
            : state.photos,
      }));
      const current = useAuthStore.getState().user;
      if (
        uri &&
        current?.id === userId &&
        !current.avatar?.startsWith('/api/attachments/')
      ) {
        // A migração é oportunista; falha de rede não pode virar rejeição não tratada.
        await get().save(userId, uri).catch(() => undefined);
      }
    })();
    pendingLoads.set(userId, loading);
    try {
      await loading;
    } finally {
      pendingLoads.delete(userId);
    }
  },
  save: async (userId, uri) => {
    const before = useAuthStore.getState();
    if (before.user?.id !== userId || !before.isAuthenticated) return;
    const version = before.sessionVersion;
    const avatar = await uploadImage(uri);
    const current = useAuthStore.getState();
    if (current.user?.id !== userId || current.sessionVersion !== version)
      return;
    const profile = await mutation<SessionUser>('/profile/avatar', 'PUT', {
      avatar,
    });
    if (!(await useAuthStore.getState().acceptProfile(profile, version)))
      return;
    await AsyncStorage.removeItem(key(userId));
    set((state) => ({ photos: { ...state.photos, [userId]: avatar } }));
  },
}));
