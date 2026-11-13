import { fetch } from 'expo/fetch';
import * as SecureStore from 'expo-secure-store';
import { QueryClient, type QueryKey } from '@tanstack/react-query';
import type { ApiResult } from '@/shared/contracts';
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:43001/api'
).replace(/\/$/, '');
// O app nativo recebe o token da sessão no corpo (vai para o SecureStore); o
// navegador recebe só o cookie httpOnly. A API decide por este cabeçalho.
// Sem importar react-native aqui: no app nativo não existe `document`.
const CLIENT_HEADER = typeof document === 'undefined' ? 'citizen-native' : 'citizen';
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Repetir só falha de transporte: 404, 401 ou 422 não mudam na segunda vez.
      retry: (failureCount, error) => error instanceof NetworkError && failureCount < 2,
      staleTime: 15000,
    },
  },
});
/** Falha de transporte (sem rede/timeout), distinta de resposta do servidor como 401. */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}
/** Resposta recebida do servidor (inclusive 401/500): distinta de falta de rede. */
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
let sessionToken: string | null = null;
let onExpired: (() => void) | undefined;
async function expireUnauthorizedSession(path: string, status: number) {
  if (status === 401 && path !== '/auth/login') {
    await saveToken(null);
    onExpired?.();
  }
}
async function readResult<T>(
  path: string,
  status: number,
  result: ApiResult<T>,
): Promise<T> {
  await expireUnauthorizedSession(path, status);
  if (
    !result ||
    typeof result !== 'object' ||
    typeof result.success !== 'boolean'
  )
    throw new ApiError(
      'Algo deu errado. Tente de novo em instantes.',
    );
  if (status < 200 || status >= 300 || !result.success)
    throw new ApiError(
      result.error || 'Não deu certo. Tente de novo.',
    );
  return result.data as T;
}
export function onSessionExpired(callback: () => void) {
  onExpired = callback;
}
export async function restoreToken() {
  sessionToken = await SecureStore.getItemAsync('fiscaliza-session');
}
export async function saveToken(token: string | null) {
  sessionToken = token;
  if (token) {
    await SecureStore.setItemAsync('fiscaliza-session', token);
  } else {
    await SecureStore.deleteItemAsync('fiscaliza-session');
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
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 15000);
  try {
    const multipart = body instanceof FormData;
    const response = await fetch(API_URL + path, {
      method,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'X-Fiscaliza-Client': CLIENT_HEADER,
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
    let result: ApiResult<T>;
    try {
      result = (await response.json()) as ApiResult<T>;
    } catch {
      await expireUnauthorizedSession(path, response.status);
      throw new ApiError(
        response.status >= 500
          ? 'O app está fora do ar por um momento. Tente de novo em instantes.'
          : 'Algo deu errado. Tente de novo em instantes.',
      );
    }
    return await readResult(path, response.status, result);
  } catch (error) {
    // A superseded query is cancellation, not an offline error to show to users.
    if (signal?.aborted) throw error;
    // Tudo que não veio do servidor (TypeError, timeout, falha nativa de rede) é falta de conexão.
    if (error instanceof ApiError) throw error;
    // Demora do servidor não é falta de internet: a mensagem diz o que houve.
    throw new NetworkError(
      timedOut
        ? 'O servidor demorou para responder. Tente de novo em instantes.'
        : 'Sem internet no momento. Confira sua conexão e tente de novo.',
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
/** Grava e invalida só as consultas afetadas (nenhuma por padrão); nunca o cache inteiro. */
export async function mutation<T>(
  path: string,
  method: string,
  body?: unknown,
  invalidate: readonly QueryKey[] = [],
) {
  const result = await request<T>(path, method, body);
  await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  return result;
}
export function assetUrl(url: string) {
  return url.startsWith('/') ? API_URL.replace(/\/api$/, '') + url : url;
}
export async function uploadImage(uri: string): Promise<string> {
  if (uri.startsWith('/api/attachments/') || /^https?:/.test(uri)) return uri;
  // Native mobile uploader via Expo FileSystem
  const fs = await import('expo-file-system/legacy');
  if (!(await fs.getInfoAsync(uri)).exists) {
    throw new Error(
      'A foto não está mais disponível. Escolha a imagem novamente.',
    );
  }
  const task = fs.createUploadTask(API_URL + '/attachments', uri, {
    httpMethod: 'POST',
    uploadType: fs.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    headers: {
      'X-Fiscaliza-Client': CLIENT_HEADER,
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
    if (expired || !response) {
      throw new Error('O envio da foto foi interrompido. Tente de novo.');
    }
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
