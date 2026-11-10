import { Linking } from 'react-native';

/**
 * Abre um link externo e tenta o endereço alternativo se o principal não abrir.
 * Nunca lança: devolve false para a tela mostrar o erro ao usuário.
 */
export async function openExternal(url: string, fallbackUrl?: string): Promise<boolean> {
  for (const target of fallbackUrl ? [url, fallbackUrl] : [url]) {
    try {
      await Linking.openURL(target);
      return true;
    } catch {
      // tenta o próximo endereço
    }
  }
  return false;
}
