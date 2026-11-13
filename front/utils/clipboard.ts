import * as Clipboard from 'expo-clipboard';

/** Copia texto para a área de transferência; devolve `false` se o sistema recusar. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}
