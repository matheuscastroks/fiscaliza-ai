import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { SessionUser } from '@/shared/contracts';
import type { RegistrationInput } from '@/shared/registration';
import { authApi } from '@/services/auth';
import { applyCurrentProfile } from '@/shared/profile-session';
import {
  NetworkError,
  onSessionExpired,
  queryClient,
  request,
  restoreToken,
  saveToken,
} from '@/services/http';
const SESSION_CACHE_KEY = 'fiscaliza-ai:session-user:v1';
async function cacheSessionUser(user: SessionUser | null) {
  try {
    if (user) await AsyncStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(user));
    else await AsyncStorage.removeItem(SESSION_CACHE_KEY);
  } catch {
    // O cache é só conveniência offline; falhar aqui não pode quebrar a sessão.
  }
}
async function readCachedSessionUser(): Promise<SessionUser | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_CACHE_KEY);
    const user = raw ? (JSON.parse(raw) as SessionUser) : null;
    return user && typeof user.id === 'string' ? user : null;
  } catch {
    return null;
  }
}
interface AuthState {
  /** true quando a sessão veio do cache porque o servidor estava inacessível. */
  offline: boolean;
  user: SessionUser | null;
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
  register: (
    input: RegistrationInput,
  ) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  acceptProfile: (
    user: SessionUser,
    expectedVersion: number,
  ) => Promise<boolean>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  setLoading: (loading: boolean) => void;
}
export const useAuthStore = create<AuthState>((set, get) => ({
  offline: false,
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
      set({ user: user, isAuthenticated: true, offline: false });
      void cacheSessionUser(user);
    } catch (error) {
      // Sem rede não é sessão inválida: mantém o usuário em cache (401 já limpa o token).
      const cached = error instanceof NetworkError ? await readCachedSessionUser() : null;
      if (cached) set({ user: cached, isAuthenticated: true, offline: true });
      else {
        set({ user: null, isAuthenticated: false, offline: false });
        void cacheSessionUser(null);
      }
    } finally {
      set({ isReady: true });
    }
  },
  login: async (email, password) => {
    if (get().isLoading) return { success: false };
    set({
      isLoading: true,
      error: null,
      sessionVersion: get().sessionVersion + 1,
    });
    const result = await authApi.login(email, password);
    if (result.success) {
      await queryClient.cancelQueries();
      queryClient.clear();
    }
    set({
      isReady: true,
      isLoading: false,
      error: result.error || null,
      ...(result.data ? { user: result.data, isAuthenticated: true, offline: false } : {}),
    });
    if (result.data) void cacheSessionUser(result.data);
    return { success: result.success, error: result.error };
  },
  register: async (input) => {
    if (get().isLoading) return { success: false };
    set({
      isLoading: true,
      error: null,
      sessionVersion: get().sessionVersion + 1,
    });
    const result = await authApi.register(input);
    if (result.success) {
      await queryClient.cancelQueries();
      queryClient.clear();
    }
    set({
      isReady: true,
      isLoading: false,
      error: result.error || null,
      ...(result.data ? { user: result.data, isAuthenticated: true, offline: false } : {}),
    });
    if (result.data) void cacheSessionUser(result.data);
    return { success: result.success, error: result.error };
  },
  logout: async () => {
    set({ sessionVersion: get().sessionVersion + 1 });
    try {
      await request('/auth/logout', 'POST');
    } finally {
      await saveToken(null);
      await cacheSessionUser(null);
      queryClient.clear();
      set({ user: null, isAuthenticated: false, error: null, offline: false });
    }
  },
  clearError: () => set({ error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  refreshUser: async () => {
    const expected = { userId: get().user?.id, version: get().sessionVersion };
    if (!expected.userId) return;
    const result = await authApi.getCurrentUser();
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
        set({
          user: user,
          sessionVersion: get().sessionVersion + 1,
        });
      },
    );
  },
  deleteAccount: async () => {
    if (get().isLoading) return { success: false };
    set({ isLoading: true });
    try {
      const result = await authApi.deleteAccount();
      // A conta continua existindo no servidor: preserva a sessão para
      // permitir nova tentativa.
      if (!result.success) return result;
      try {
        await get().logout();
      } catch {
        // A conta já foi removida; o encerramento local ocorre no finally de logout.
      }
      set({ user: null, isAuthenticated: false });
      return result;
    } finally {
      set({ isLoading: false });
    }
  },
}));
onSessionExpired(() => {
  void cacheSessionUser(null);
  queryClient.clear();
  useAuthStore.setState((state) => ({
    user: null,
    isAuthenticated: false,
    sessionVersion: state.sessionVersion + 1,
  }));
});
