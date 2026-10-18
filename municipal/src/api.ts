import type { ApiResult } from '../../shared/contracts';
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers:
        body instanceof FormData
          ? undefined
          : body === undefined
            ? undefined
            : { 'Content-Type': 'application/json' },
      body:
        body instanceof FormData
          ? body
          : body === undefined
            ? undefined
            : JSON.stringify(body),
    });
  } catch {
    throw new Error(
      'Sem conexão com o serviço. Verifique a rede e tente novamente.',
    );
  }
  let result: ApiResult<T>;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      'O serviço retornou uma resposta inválida. Tente novamente.',
    );
  }
  if (!response.ok || !result.success) {
    if (response.status === 401)
      window.dispatchEvent(new Event('session-expired'));
    throw new ApiError(
      result.error || 'Não foi possível concluir a operação.',
      response.status,
    );
  }
  return result.data as T;
}
export async function allPages<T>(path: string): Promise<T[]> {
  const values: T[] = [];
  for (let offset = 0; offset <= 100000; offset += 100) {
    const page = await api<T[]>(
      `${path}${path.includes('?') ? '&' : '?'}limit=100&offset=${offset}`,
    );
    values.push(...page);
    if (page.length < 100) break;
  }
  return values;
}
export async function upload(file: File) {
  if (file.size > 5 * 1024 * 1024)
    throw new Error('A imagem deve ter até 5 MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Selecione JPEG, PNG ou WebP.');
  const form = new FormData();
  form.append('file', file);
  return (await api<{ url: string }>('/attachments', 'POST', form)).url;
}
