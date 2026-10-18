import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { QueryClient } from '@tanstack/react-query';
import type { ApiResult } from '@/shared/contracts';
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api'
).replace(/\/$/, '');
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15000 } },
});
let sessionToken: string | null = null;
let onExpired: (() => void) | undefined;
export function onSessionExpired(callback: () => void) {
  onExpired = callback;
}
export async function restoreToken() {
  if (Platform.OS !== 'web')
    sessionToken = await SecureStore.getItemAsync('fiscaliza-session');
}
export async function saveToken(token: string | null) {
  sessionToken = token;
  if (Platform.OS !== 'web') {
    if (token) await SecureStore.setItemAsync('fiscaliza-session', token);
    else await SecureStore.deleteItemAsync('fiscaliza-session');
  }
}
export async function request<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const multipart = body instanceof FormData;
    const response = await fetch(API_URL + path, {
      method,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'X-Fiscaliza-Client': 'citizen',
        ...(multipart || body === undefined
          ? {}
          : { 'Content-Type': 'application/json' }),
        ...(sessionToken ? { Authorization: 'Bearer ' + sessionToken } : {}),
      },
      body:
        body === undefined
          ? undefined
          : multipart
            ? body
            : JSON.stringify(body),
    });
    if (response.status === 401 && path !== '/auth/login') {
      await saveToken(null);
      onExpired?.();
    }
    const result = (await response.json()) as ApiResult<T>;
    if (!response.ok || !result.success)
      throw new Error(
        result.error || 'Não foi possível concluir. Tente novamente.',
      );
    return result.data as T;
  } catch (error) {
    if (
      error instanceof TypeError ||
      (error instanceof Error && error.name === 'AbortError')
    )
      throw new Error(
        'Sem conexão com o serviço. Verifique a rede e tente novamente.',
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
export async function mutation<T>(
  path: string,
  method: string,
  body?: unknown,
) {
  const result = await request<T>(path, method, body);
  await queryClient.invalidateQueries();
  return result;
}
export async function requestAll<T>(path: string): Promise<T[]> {
  const result: T[] = [];
  for (let offset = 0; offset <= 100000; offset += 100) {
    const page = await request<T[]>(
      path + (path.includes('?') ? '&' : '?') + 'limit=100&offset=' + offset,
    );
    result.push(...page);
    if (page.length < 100) break;
  }
  return result;
}
export function assetUrl(url: string) {
  return url.startsWith('/') ? API_URL.replace(/\/api$/, '') + url : url;
}
export async function uploadImage(uri: string): Promise<string> {
  if (uri.startsWith('/api/attachments/') || /^https?:/.test(uri)) return uri;
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('file', blob, 'evidencia.jpg');
  } else {
    const type = /\.png(?:\?|$)/i.test(uri)
      ? 'image/png'
      : /\.webp(?:\?|$)/i.test(uri)
        ? 'image/webp'
        : 'image/jpeg';
    form.append('file', {
      uri,
      name: 'evidencia.' + type.split('/')[1],
      type,
    } as unknown as Blob);
  }
  return (await request<{ url: string }>('/attachments', 'POST', form)).url;
}
