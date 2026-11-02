import { useAuthStore } from '@/stores/authStore';

export const testLoginEnabled =
  __DEV__ || process.env.EXPO_PUBLIC_ENABLE_TEST_LOGIN === 'true';

/** Demonstration credentials only; never select a staff or administrator account. */
export async function loginWithTestAccount() {
  if (!testLoginEnabled) return { success: false };
  return useAuthStore.getState().login(
    'beatrizarante@gmail.com',
    'Fiscaliza123!',
  );
}
