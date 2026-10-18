import { create } from 'zustand';
import type { User } from '@/data/mockData';
import type { SessionUser } from '@/shared/contracts';
import { authApi, legacyUser } from '@/services/mockApi';
import { useProblemsStore } from './problemsStore';
import { applyCurrentProfile } from '@/shared/profile-session';
import {
  onSessionExpired,
  queryClient,
  request,
  restoreToken,
  saveToken,
} from '@/services/http';
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isReady: boolean;
  sessionVersion: number;
  error: string | null;
  initialize: () => Promise<void>;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  acceptProfile: (
    user: SessionUser,
    expectedVersion: number,
  ) => Promise<boolean>;
  setLoading: (loading: boolean) => void;
}
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isReady: false,
  sessionVersion: 0,
  error: null,
  initialize: async () => {
    try {
      await restoreToken();
      const user = await request<SessionUser>('/auth/me');
      set({ user: legacyUser(user), isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isReady: true });
    }
  },
  login: async (email, password) => {
    set({
      isLoading: true,
      error: null,
      sessionVersion: get().sessionVersion + 1,
    });
    const result = await authApi.login(email, password);
    if (result.success) {
      await queryClient.cancelQueries();
      queryClient.clear();
      useProblemsStore.getState().reset();
    }
    set({
      isLoading: false,
      error: result.error || null,
      ...(result.data ? { user: result.data, isAuthenticated: true } : {}),
    });
    return { success: result.success, error: result.error };
  },
  logout: async () => {
    set({ sessionVersion: get().sessionVersion + 1 });
    try {
      await request('/auth/logout', 'POST');
    } finally {
      await saveToken(null);
      queryClient.clear();
      useProblemsStore.getState().reset();
      set({ user: null, isAuthenticated: false, error: null });
    }
  },
  clearError: () => set({ error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  refreshUser: async () => {
    const expected = { userId: get().user?.id, version: get().sessionVersion };
    if (!expected.userId) return;
    const result = await authApi.getUserById(expected.userId);
    if (result.data) {
      await applyCurrentProfile(
        { userId: expected.userId, version: expected.version },
        () => ({
          userId: get().user?.id,
          version: get().sessionVersion,
          authenticated: get().isAuthenticated,
        }),
        async () => {
          if (result.data?.municipality?.id !== get().user?.municipality?.id)
            await queryClient.cancelQueries();
        },
        () => {
          if (result.data?.municipality?.id !== get().user?.municipality?.id) {
            queryClient.clear();
            useProblemsStore.getState().reset();
          }
          set({ user: result.data, sessionVersion: get().sessionVersion + 1 });
        },
      );
    }
  },
  acceptProfile: async (user, expectedVersion) => {
    return applyCurrentProfile(
      { userId: user.id, version: expectedVersion },
      () => ({
        userId: get().user?.id,
        version: get().sessionVersion,
        authenticated: get().isAuthenticated,
      }),
      () => queryClient.cancelQueries(),
      () => {
        queryClient.clear();
        useProblemsStore.getState().reset();
        set({
          user: legacyUser(user),
          sessionVersion: get().sessionVersion + 1,
        });
      },
    );
  },
  updateUser: async () =>
    set({ error: 'A edição de conta não está disponível.' }),
}));
onSessionExpired(() => {
  queryClient.clear();
  useProblemsStore.getState().reset();
  useAuthStore.setState((state) => ({
    user: null,
    isAuthenticated: false,
    sessionVersion: state.sessionVersion + 1,
  }));
});
