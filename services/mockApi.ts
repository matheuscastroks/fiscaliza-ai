import AsyncStorage from '@react-native-async-storage/async-storage';

import { mockUsers, type Problem, type User } from '@/data/mockData';
import { createDemoRepository } from '@/demo/repository';
import type { DemoScenario } from '@/demo/types';

export interface ApiResponse<T> { success: boolean; data?: T; error?: string }
const responseError = (error: unknown): ApiResponse<never> => ({
  success: false,
  error: error instanceof Error ? error.message : 'Não foi possível acessar os dados locais.',
});
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const withoutPassword = (user: User): User => {
  const { password: _, ...safe } = copy(user);
  return safe as User;
};

/** Armazenamento local da aplicação do cidadão. */
export const citizenDemoRepository = createDemoRepository(AsyncStorage, 'fiscaliza:citizen:v1');

export const demoApi = {
  getScenario: (): Promise<DemoScenario> => citizenDemoRepository.getScenario(),
  reset: (scenario: DemoScenario): Promise<void> => citizenDemoRepository.reset(scenario),
  getWarning: (): string | null => citizenDemoRepository.getWarning(),
};

export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<User>> {
    const user = mockUsers.find(u => u.email === email && u.password === password);
    return user ? { success: true, data: withoutPassword(user) } : { success: false, error: 'Email ou senha incorretos' };
  },
  async getUserById(userId: string): Promise<ApiResponse<User>> {
    const user = mockUsers.find(u => u.id === userId);
    return user ? { success: true, data: withoutPassword(user) } : { success: false, error: 'Usuário não encontrado' };
  },
  async updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    const index = mockUsers.findIndex(u => u.id === userId);
    if (index < 0) return { success: false, error: 'Usuário não encontrado' };
    mockUsers[index] = { ...mockUsers[index], ...copy(updates), id: userId };
    return { success: true, data: withoutPassword(mockUsers[index]) };
  },
};

export const problemsApi = {
  async getProblems(filters?: { status?: string; category?: string; userId?: string }): Promise<ApiResponse<Problem[]>> {
    try { return { success: true, data: await citizenDemoRepository.list(filters) }; }
    catch (error) { return responseError(error); }
  },
  async getProblemById(problemId: string): Promise<ApiResponse<Problem>> {
    try {
      const problem = await citizenDemoRepository.get(problemId);
      return problem ? { success: true, data: problem } : { success: false, error: 'Problema não encontrado' };
    } catch (error) { return responseError(error); }
  },
  async createProblem(problemData: Omit<Problem, 'id' | 'reportedAt' | 'votes' | 'comments'>): Promise<ApiResponse<Problem>> {
    try { return { success: true, data: await citizenDemoRepository.create(problemData) }; }
    catch (error) { return responseError(error); }
  },
  async updateProblem(problemId: string, updates: Partial<Problem>): Promise<ApiResponse<Problem>> {
    try { return { success: true, data: await citizenDemoRepository.update(problemId, updates) }; }
    catch (error) { return responseError(error); }
  },
  async voteProblem(problemId: string, _userId: string): Promise<ApiResponse<{ votes: number }>> {
    try { return { success: true, data: { votes: await citizenDemoRepository.vote(problemId) } }; }
    catch (error) { return responseError(error); }
  },
  async addComment(problemId: string, userId: string, text: string): Promise<ApiResponse<Problem>> {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) return { success: false, error: 'Usuário não encontrado' };
    try { return { success: true, data: await citizenDemoRepository.comment(problemId, userId, user.name, text) }; }
    catch (error) { return responseError(error); }
  },
};

export const statsApi = {
  async getGlobalStats(): Promise<ApiResponse<{
    totalProblems: number; resolvedProblems: number; pendingProblems: number;
    inProgressProblems: number; totalUsers: number; activeUsers: number;
  }>> {
    try {
      const problems = await citizenDemoRepository.list();
      return { success: true, data: {
        totalProblems: problems.length,
        resolvedProblems: problems.filter(p => p.status === 'resolved').length,
        pendingProblems: problems.filter(p => p.status === 'pending').length,
        inProgressProblems: problems.filter(p => p.status === 'in_progress').length,
        totalUsers: mockUsers.length,
        activeUsers: mockUsers.filter(u => u.points > 0).length,
      } };
    } catch (error) { return responseError(error); }
  },
  async getUserStats(userId: string): Promise<ApiResponse<{
    problemsReported: number; problemsResolved: number; totalVotes: number; totalComments: number;
  }>> {
    try {
      const problems = await citizenDemoRepository.list();
      const owned = problems.filter(p => p.reportedBy === userId);
      return { success: true, data: {
        problemsReported: owned.length,
        problemsResolved: owned.filter(p => p.status === 'resolved').length,
        totalVotes: owned.reduce((sum, p) => sum + p.votes, 0),
        totalComments: problems.reduce((sum, p) => sum + p.comments.filter(c => c.userId === userId).length, 0),
      } };
    } catch (error) { return responseError(error); }
  },
  async getRanking(): Promise<ApiResponse<User[]>> {
    try {
      const problems = await citizenDemoRepository.list();
      const ranking = mockUsers.map(user => {
        const owned = problems.filter(p => p.reportedBy === user.id);
        return { ...withoutPassword(user), problemsReported: owned.length,
          problemsResolved: owned.filter(p => p.status === 'resolved').length,
          totalVotes: owned.reduce((sum, p) => sum + p.votes, 0),
          efficiency: owned.length ? Math.round(owned.filter(p => p.status === 'resolved').length / owned.length * 100) : 0 };
      }).sort((a, b) => b.points - a.points).map((user, index) => ({ ...user, ranking: index + 1 }));
      return { success: true, data: ranking };
    } catch (error) { return responseError(error); }
  },
};

export const simulateNetworkError = (): ApiResponse<never> => ({ success: false, error: 'Armazenamento local indisponível.' });
export const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const uploadImage = async (imageUri: string): Promise<ApiResponse<string>> =>
  imageUri.trim() ? { success: true, data: imageUri } : { success: false, error: 'Imagem inválida.' };
