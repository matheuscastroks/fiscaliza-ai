import { Platform } from 'react-native';
import { fetch } from 'expo/fetch';
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
async function readResult<T>(
  path: string,
  status: number,
  result: ApiResult<T>,
): Promise<T> {
  if (status === 401 && path !== '/auth/login') {
    await saveToken(null);
    onExpired?.();
  }
  if (status < 200 || status >= 300 || !result.success)
    throw new Error(
      result.error || 'Não foi possível concluir. Tente novamente.',
    );
  return result.data as T;
}
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
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) {
    const error = new Error('Solicitação cancelada.');
    error.name = 'AbortError';
    throw error;
  }
  signal?.addEventListener('abort', cancel, { once: true });
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
    const result = (await response.json()) as ApiResult<T>;
    return await readResult(path, response.status, result);
  } catch (error) {
    // A superseded query is cancellation, not an offline error to show to users.
    if (signal?.aborted) throw error;
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
    signal?.removeEventListener('abort', cancel);
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
  if (Platform.OS !== 'web') {
    // This API uses the existing native uploader, without constructing File or
    // passing React Native URI descriptors through Expo fetch's FormData encoder.
    const fs = await import('expo-file-system/legacy');
    if (!(await fs.getInfoAsync(uri)).exists)
      throw new Error(
        'A foto não está mais disponível. Escolha a imagem novamente.',
      );
    const task = fs.createUploadTask(API_URL + '/attachments', uri, {
      httpMethod: 'POST',
      uploadType: fs.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      headers: {
        'X-Fiscaliza-Client': 'citizen',
        ...(sessionToken ? { Authorization: 'Bearer ' + sessionToken } : {}),
      },
    });
    let expired = false;
    const timer = setTimeout(() => {
      expired = true;
      void task.cancelAsync().catch(() => undefined);
    }, 15000);
    try {
      const response = await task.uploadAsync();
      if (expired || !response)
        throw new Error('O envio da foto foi interrompido. Tente novamente.');
      const result = await readResult<{ url: string }>(
        '/attachments',
        response.status,
        JSON.parse(response.body),
      );
      return result.url;
    } finally {
      clearTimeout(timer);
    }
  }
  const form = new FormData();
  const blob = await (await fetch(uri)).blob();
  form.append('file', blob, 'evidencia.jpg');
  return (await request<{ url: string }>('/attachments', 'POST', form)).url;
}
