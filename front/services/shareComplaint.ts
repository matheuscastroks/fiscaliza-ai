import { Platform } from 'react-native';
import {
  OFFICIAL_WHATSAPP_NUMBER,
  OFFICIAL_WHATSAPP_URL,
} from '@/features/city/OfficialChannel';
import { openExternal } from './openExternal';

export type ShareOutcome = 'sent' | 'cancelled' | 'failed';

const cancelled = (error: unknown) =>
  error instanceof Error && /cancel|dismiss/i.test(error.message);

/**
 * Abre o WhatsApp do 1746 com o texto e, havendo foto, com a imagem anexada.
 * No Android a conversa do 1746 abre direto; no iOS o WhatsApp pede para
 * escolher a conversa. Sem o módulo nativo (build antigo) ou sem WhatsApp,
 * cai no link oficial só com o texto.
 */
export async function sendComplaintToWhatsApp(
  message: string,
  photoUri: string | null,
): Promise<ShareOutcome> {
  if (photoUri) {
    try {
      const { default: Share } = await import('react-native-share');
      const options = {
        social: Share.Social.WHATSAPP,
        url: photoUri,
        type: 'image/jpeg',
        message,
      } as Parameters<typeof Share.shareSingle>[0];
      // whatsAppNumber é lido pelo módulo Android (abre a conversa do 1746),
      // mas não consta nos tipos da biblioteca.
      await Share.shareSingle(
        Platform.OS === 'android'
          ? ({ ...options, whatsAppNumber: OFFICIAL_WHATSAPP_NUMBER } as unknown as typeof options)
          : options,
      );
      return 'sent';
    } catch (error) {
      if (cancelled(error)) return 'cancelled';
      // Segue para o link oficial só com o texto.
    }
  }
  const text = encodeURIComponent(message);
  const opened = await openExternal(
    `${OFFICIAL_WHATSAPP_URL}?text=${text}`,
    `https://api.whatsapp.com/send?phone=${OFFICIAL_WHATSAPP_NUMBER}&text=${text}`,
  );
  return opened ? 'sent' : 'failed';
}

/** Folha de compartilhamento do sistema com texto e foto (sem destino fixo). */
export async function shareComplaint(message: string, photoUri: string | null) {
  try {
    const { default: Share } = await import('react-native-share');
    await Share.open({
      message,
      title: 'Solicitação 1746',
      ...(photoUri ? { url: photoUri, type: 'image/jpeg' } : {}),
      failOnCancel: false,
    });
  } catch {
    const { Share } = await import('react-native');
    await Share.share({ message, title: 'Solicitação 1746' }).catch(() => undefined);
  }
}
