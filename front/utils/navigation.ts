import { router } from 'expo-router';

/** Direct links and Expo reloads may have no previous route to dismiss. */
export function goBack() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/(tabs)');
}
