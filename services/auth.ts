/** Compatibility adapter: product data comes from HTTP, never silent local mocks. */
import type { User } from '@/data/mockData';
import type {
  ApiResult,
  SessionUser,
} from '@/shared/contracts';
import { request, saveToken } from './http';
import type { RegistrationInput } from '@/shared/registration';
export type ApiResponse<T> = ApiResult<T>;
export function legacyUser(user: SessionUser): User {
  return {
    ...user,
    level: 1,
    points: 0,
    ranking: 0,
    badges: [],
    createdAt: '',
    streak: 0,
    lastActivity: '',
    totalComments: 0,
    joinedDaysAgo: 0,
    nextLevelPoints: 0,
  };
}
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
      return legacyUser(session.user);
    }),
  login: (email: string, password: string) =>
    wrap(async () => {
      const session = await request<{ user: SessionUser; token: string }>(
        '/auth/login',
        'POST',
        { email, password },
      );
      await saveToken(session.token);
      return legacyUser(session.user);
    }),
  getUserById: (_id: string) =>
    wrap(async () => legacyUser(await request<SessionUser>('/auth/me'))),
  updateUser: (
    _id: string,
    _updates: Partial<User>,
  ): Promise<ApiResult<User>> =>
    Promise.resolve({
      success: false,
      error: 'A edição de conta não está disponível.',
    }),
};
