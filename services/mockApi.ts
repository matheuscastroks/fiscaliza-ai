/** Compatibility adapter: product data comes from HTTP, never silent local mocks. */
import type { User, Problem } from '@/data/mockData';
import type {
  ApiResult,
  SessionUser,
  Occurrence,
  CityOverview,
} from '@/shared/contracts';
import { mutation, request, requestAll, saveToken } from './http';
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
export const problemsApi = {
  getProblems: (filters?: {
    status?: string;
    category?: string;
    userId?: string;
  }) =>
    wrap(async () => {
      const params = new URLSearchParams(
        Object.entries(filters || {}).filter(
          (entry): entry is [string, string] => Boolean(entry[1]),
        ),
      );
      return (await requestAll<Occurrence>(
        '/occurrences?' + params,
      )) as Problem[];
    }),
  getProblemById: (id: string) =>
    wrap(
      async () => (await request<Occurrence>('/occurrences/' + id)) as Problem,
    ),
  createProblem: (
    data: Omit<Problem, 'id' | 'reportedAt' | 'votes' | 'comments'>,
  ) =>
    wrap(async () => {
      const { title, description, category, priority, location, images } = data;
      return (await mutation<Occurrence>('/occurrences', 'POST', {
        title,
        description,
        category,
        reportedImpact: priority,
        location,
        images,
      })) as Problem;
    }),
  updateProblem: (
    id: string,
    data: Partial<Problem> & { justification?: string },
  ) =>
    wrap(
      async () =>
        (await mutation<Occurrence>(
          '/occurrences/' + id + '/transitions',
          'POST',
          data,
        )) as Problem,
    ),
  voteProblem: (id: string, _userId: string) =>
    wrap(async () => {
      await mutation('/occurrences/' + id + '/support', 'PUT');
      const item = await request<Occurrence>('/occurrences/' + id);
      return { votes: item.votes };
    }),
  addComment: (id: string, _userId: string, text: string) =>
    wrap(
      async () =>
        (await mutation<Occurrence>(
          '/occurrences/' + id + '/comments',
          'POST',
          { text },
        )) as Problem,
    ),
};
export const demoApi = {
  getScenario: async () => 'registered' as const,
  getWarning: () => null,
  reset: async (scenario: string) => {
    await mutation('/presentation/reset', 'POST', { scenario });
  },
};
export const statsApi = {
  getGlobalStats: () =>
    wrap(async () => {
      const stats = await request<CityOverview>('/overview');
      const items = await request<Occurrence[]>('/occurrences');
      return {
        totalProblems: stats.occurrences,
        resolvedProblems: stats.resolved,
        pendingProblems: items.filter((p) => p.status === 'pending').length,
        inProgressProblems: items.filter((p) => p.status === 'in_progress')
          .length,
        totalUsers: 0,
        activeUsers: 0,
      };
    }),
  getUserStats: (userId: string) =>
    wrap(async () => {
      const items = await request<Occurrence[]>(
        '/occurrences?userId=' + encodeURIComponent(userId),
      );
      return {
        problemsReported: items.length,
        problemsResolved: items.filter((p) => p.status === 'resolved').length,
        totalVotes: items.reduce((sum, p) => sum + p.votes, 0),
        totalComments: items.reduce((sum, p) => sum + p.comments.length, 0),
      };
    }),
  getRanking: (): Promise<ApiResult<User[]>> =>
    Promise.resolve({ success: true, data: [] }),
};
