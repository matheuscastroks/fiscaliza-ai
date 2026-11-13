import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { request } from '@/services/http';
import type {
  FollowCallNotificationPayload,
  PushNotificationResult,
  PushTokenRegistrationPayload,
  UnfollowCallNotificationPayload,
} from '@/shared/contracts';
import { DEFAULT_MUNICIPALITY_ID } from '@/features/city/municipalityId';
import { lightColors } from '@/theme/colors';

// Configura como as notificações são exibidas quando o app está em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export const NOTIFICATION_CHANNEL_ID = 'fiscaliza-calls-v2';

/**
 * Cria o canal de notificações no Android (necessário a partir do Android 8+)
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Chamados e Alertas do 1746',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: lightColors.primary,
      enableVibrate: true,
    });
  }
}

/** projectId do EAS; sem ele o Expo não emite token de push. */
export function pushProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;
}

/** Alertas só existem em versões com projectId configurado. */
export function isPushConfigured(): boolean {
  return Boolean(pushProjectId());
}

/**
 * Solicita permissão e obtém o Expo Push Token do dispositivo
 */
export async function registerForPushNotificationsAsync(
  municipalityId = DEFAULT_MUNICIPALITY_ID,
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  // Garante que o canal está configurado
  await setupNotificationChannels();

  // Verifica se é um dispositivo físico
  if (!Device.isDevice) {
    // Em emuladores/simuladores sem Google Play Services, notificações push remotas não geram token nativo
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Sem projectId do EAS o Expo não emite token: avisa em português em vez de mostrar o erro cru.
  const projectId = pushProjectId();
  if (!projectId) {
    throw new Error('Os avisos ainda não funcionam nesta versão do app.');
  }
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData.data;
  const registered = await registerTokenWithBackend(token, municipalityId);
  if (!registered) {
    throw new Error('Não conseguimos ligar os avisos. Tente de novo.');
  }
  return token;
}

/**
 * Registra o token de push na API do Fiscaliza aí
 */
export async function registerTokenWithBackend(
  token: string,
  municipalityId = DEFAULT_MUNICIPALITY_ID,
): Promise<boolean> {
  try {
    const payload: PushTokenRegistrationPayload = {
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      municipalityId,
    };
    await request('/v1/notifications/register-token', 'POST', payload);
    return true;
  } catch {
    return false;
  }
}

/** Este aparelho deixa de receber avisos da conta (ao sair dela). */
export async function unregisterTokenWithBackend(token: string): Promise<boolean> {
  try {
    await request('/v1/notifications/register-token', 'DELETE', { token });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ativa notificações no servidor para um chamado salvo específico
 */
export async function followCallForNotifications(
  callId: string,
  token: string,
): Promise<boolean> {
  try {
    const payload: FollowCallNotificationPayload = { callId, token };
    await request('/v1/notifications/follow-call', 'POST', payload);
    return true;
  } catch {
    return false;
  }
}

/**
 * Desativa notificações no servidor para um chamado
 */
export async function unfollowCallForNotifications(
  callId: string,
  token: string,
): Promise<boolean> {
  try {
    const payload: UnfollowCallNotificationPayload = { callId, token };
    await request('/v1/notifications/follow-call', 'DELETE', payload);
    return true;
  } catch {
    return false;
  }
}
