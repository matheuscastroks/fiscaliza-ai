import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

/** Direct links and Expo reloads may have no previous route to dismiss. */
export function goBack() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  const { isAuthenticated, user } = useAuthStore.getState();
  router.replace(
    !isAuthenticated
      ? '/LoginScreen'
      : user?.municipality
        ? '/(tabs)'
        : '/MunicipalityScreen',
  );
}
