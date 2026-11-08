/** Authentication backed by the API session contract. */
import type {
  ApiResult,
  SessionUser,
} from '@/shared/contracts';
import { request, saveToken } from './http';
import type { RegistrationInput } from '@/shared/registration';
async function wrap<T>(action: () => Promise<T>): Promise<ApiResult<T>> {
  try {
    return { success: true, data: await action() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Tente novamente.',
    };
  }
}
export const authApi = {
  register: (input: RegistrationInput) =>
    wrap(async () => {
      const session = await request<{ user: SessionUser; token: string }>(
        '/auth/register',
        'POST',
        input,
      );
      await saveToken(session.token);
      return session.user;
    }),
  login: (email: string, password: string) =>
    wrap(async () => {
      const session = await request<{ user: SessionUser; token: string }>(
        '/auth/login',
        'POST',
        { email, password },
      );
      await saveToken(session.token);
      return session.user;
    }),
  getCurrentUser: () =>
    wrap(async () => await request<SessionUser>('/auth/me')),
  deleteAccount: () =>
    wrap(async () => {
      await request('/auth/profile', 'DELETE');
    }),
};
