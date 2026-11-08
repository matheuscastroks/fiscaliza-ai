import { create } from 'zustand';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotificationsAsync,
  sendTestPushNotification,
  followCallForNotifications,
  unfollowCallForNotifications,
} from '@/features/notifications/notificationService';
import { useFollowStore, setFollowNotificationListener } from './followStore';

interface NotificationState {
  pushToken: string | null;
  permissionGranted: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: (municipalityId?: string) => Promise<void>;
  requestPermissions: (municipalityId?: string) => Promise<boolean>;
  sendTestPush: () => Promise<boolean>;
}

function syncSavedCalls(token: string) {
  const savedCalls = useFollowStore.getState().savedCalls;
  for (const call of savedCalls) {
    void followCallForNotifications(call.id, token);
  }
}

// Wire followStore changes to notification follow/unfollow
setFollowNotificationListener((call, saved) => {
  const token = useNotificationStore.getState().pushToken;
  if (!token) return;
  if (saved) {
    void followCallForNotifications(call.id, token);
  } else {
    void unfollowCallForNotifications(call.id, token);
  }
});

export const useNotificationStore = create<NotificationState>((set, get) => ({
  pushToken: null,
  permissionGranted: false,
  isLoading: false,
  error: null,

  initialize: async (municipalityId = '3304557') => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const granted = status === 'granted';
      set({ permissionGranted: granted, ...(granted ? {} : { pushToken: null, error: null }) });

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

  requestPermissions: async (municipalityId = '3304557') => {
    set({ isLoading: true, error: null });
    try {
      const token = await registerForPushNotificationsAsync(municipalityId);
      if (token) {
        set({ pushToken: token, permissionGranted: true, isLoading: false });
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
