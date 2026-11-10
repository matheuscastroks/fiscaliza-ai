import { create } from 'zustand';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotificationsAsync,
  sendTestPushNotification,
  followCallForNotifications,
  unfollowCallForNotifications,
} from '@/features/notifications/notificationService';
import { useFollowStore, setFollowNotificationListener } from './followStore';
import { DEFAULT_MUNICIPALITY_ID } from '@/features/city/municipalityId';

interface NotificationState {
  pushToken: string | null;
  permissionGranted: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: (municipalityId?: string) => Promise<void>;
  requestPermissions: (municipalityId?: string) => Promise<boolean>;
  sendTestPush: () => Promise<boolean>;
  /** Esquece token e pendências ao trocar ou encerrar a sessão. */
  reset: () => void;
  /** Reenvia chamados salvos cujo acompanhamento falhou ou pertence a outra sessão. */
  resync: () => void;
}

// Chamados cujo follow não chegou ao servidor; reenviados em resync/initialize.
const pendingFollows = new Set<string>();

async function followWithRetry(callId: string, token: string) {
  const ok = await followCallForNotifications(callId, token);
  if (ok) pendingFollows.delete(callId);
  else pendingFollows.add(callId);
}

function syncSavedCalls(token: string) {
  const savedCalls = useFollowStore.getState().savedCalls;
  for (const call of savedCalls) {
    void followWithRetry(call.id, token);
  }
}

// Wire followStore changes to notification follow/unfollow
setFollowNotificationListener((call, saved) => {
  const token = useNotificationStore.getState().pushToken;
  if (!token) return;
  if (saved) {
    void followWithRetry(call.id, token);
  } else {
    pendingFollows.delete(call.id);
    void unfollowCallForNotifications(call.id, token);
  }
});

export const useNotificationStore = create<NotificationState>((set, get) => ({
  pushToken: null,
  permissionGranted: false,
  isLoading: false,
  error: null,

  initialize: async (municipalityId = DEFAULT_MUNICIPALITY_ID) => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const granted = status === 'granted';
      if (!granted) {
        set({ permissionGranted: false, pushToken: null, error: null });
        return;
      }
      set({ permissionGranted: true });

      if (granted && !get().pushToken) {
        const token = await registerForPushNotificationsAsync(municipalityId);
        if (token) {
          set({ pushToken: token, error: null });
          syncSavedCalls(token);
        }
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Falha ao inicializar notificações' });
    }
  },

  requestPermissions: async (municipalityId = DEFAULT_MUNICIPALITY_ID) => {
    set({ isLoading: true, error: null });
    try {
      const token = await registerForPushNotificationsAsync(municipalityId);
      if (token) {
        set({ pushToken: token, permissionGranted: true });
        syncSavedCalls(token);
        return true;
      }
      const { status } = await Notifications.getPermissionsAsync();
      const granted = status === 'granted';
      set({
        pushToken: null,
        permissionGranted: granted,
        error: granted ? 'A permissão foi concedida, mas não foi possível ativar os alertas. Tente novamente.' : null,
      });
      return false;
    } catch {
      set({
        pushToken: null,
        error: 'Não foi possível ativar os alertas. Tente novamente.',
      });
      try {
        const { status } = await Notifications.getPermissionsAsync();
        set({ permissionGranted: status === 'granted' });
      } catch {
        set({ permissionGranted: false });
      }
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => {
    pendingFollows.clear();
    set({ pushToken: null, permissionGranted: false, isLoading: false, error: null });
  },

  resync: () => {
    const token = get().pushToken;
    if (token) syncSavedCalls(token);
  },

  sendTestPush: async () => {
    const token = get().pushToken;
    if (!token) return false;
    try {
      const result = await sendTestPushNotification(token);
      return result.success;
    } catch {
      return false;
    }
  },
}));
