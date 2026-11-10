import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { request } from '@/services/http';
import type {
  FollowCallNotificationPayload,
  PushNotificationResult,
  PushTokenRegistrationPayload,
  TestNotificationPayload,
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

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;
  const registered = await registerTokenWithBackend(token, municipalityId);
  if (!registered) {
    throw new Error('Não foi possível registrar os alertas no servidor. Tente novamente.');
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

/**
 * Dispara uma notificação push de teste para o próprio aparelho
 */
export async function sendTestPushNotification(
  token: string,
): Promise<PushNotificationResult> {
  const payload: TestNotificationPayload = {
    token,
    title: 'Fiscaliza aí · Notificações Ativas',
    body: 'Seu aparelho está pronto para receber alertas de status dos chamados do 1746!',
  };
  return request<PushNotificationResult>('/v1/notifications/test', 'POST', payload);
}
