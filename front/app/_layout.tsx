import { monitoringEnabled, navigationIntegration, identifyUser, Sentry } from '@/features/monitoring/sentry';
import { CitizenStack } from '@/features/navigation/CitizenStack';
import {
  OnboardingGate,
  useOnboardingInitialization,
} from '@/features/onboarding/OnboardingGate';
import { useTheme, useThemeInitialization } from '@/theme/useTheme';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useRef } from 'react';
import {
  router,
  useNavigationContainerRef,
  useSegments,
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from 'expo-router';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { persistOptions } from '@/features/network/queryPersistence';
import { onReconnectOrForeground, startQueryLifecycle } from '@/features/network/queryLifecycle';
import { ScreenErrorFallback } from '@/components/ui/ScreenErrorFallback';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useAuthStore } from '@/stores/authStore';
import { queryClient } from '@/services/http';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { AnimatedBrandSplash } from '@/components/ui/AnimatedBrandSplash';
import { SignOutSheet } from '@/components/ui/SignOutSheet';
import { useFollowStore, setSavedCallsAccountApi } from '@/stores/followStore';
import { savedCallsAccountApi } from '@/services/savedCalls';
import { useTerritoryStore } from '@/stores/territoryStore';
import { useTerritoryFilterStore } from '@/stores/territoryFilterStore';
import { usePlacesStore } from '@/stores/placesStore';
import { useNotificationStore } from '@/stores/notificationStore';
import * as Notifications from 'expo-notifications';

import { DEFAULT_MUNICIPALITY_ID } from '@/features/city/municipalityId';
import {
  useFonts,
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import { useShallow } from 'zustand/react/shallow';
export const unstable_settings = { anchor: '(tabs)' };

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

setSavedCallsAccountApi(savedCallsAccountApi);
startQueryLifecycle();
// Mudanças nos salvos feitas sem internet sobem quando a rede ou o app voltam.
onReconnectOrForeground(() => {
  void useFollowStore.getState().syncWithAccount();
});

/** Erro de renderização em qualquer tela: em vez de fechar o app, oferece tentar de novo. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  useEffect(() => {
    if (monitoringEnabled) Sentry.captureException(error);
  }, [error]);
  return <ScreenErrorFallback onRetry={() => void retry()} />;
}

function RootLayout() {
  const navigationRef = useNavigationContainerRef();
  useEffect(() => {
    if (monitoringEnabled) navigationIntegration.registerNavigationContainer(navigationRef);
  }, [navigationRef]);
  const { colors, isDark } = useTheme();
  const themeReady = useThemeInitialization();
  const onboardingReady = useOnboardingInitialization();
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.canvas).catch(() => undefined);
  }, [colors.canvas]);

  const [fontsLoaded, fontError] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  });
  const { isReady, isAuthenticated, initialize, user } = useAuthStore(useShallow((s) => ({ isReady: s.isReady, isAuthenticated: s.isAuthenticated, initialize: s.initialize, user: s.user })));
  const segments: readonly string[] = useSegments();
  useEffect(() => {
    void initialize();
  }, [initialize]);
  useEffect(() => {
    // Novo usuário (ou logout) nunca herda o token/inscrições do anterior.
    useNotificationStore.getState().reset();
    void useNotificationStore.getState().initialize(user?.municipality?.id || DEFAULT_MUNICIPALITY_ID);
    identifyUser(user?.id ?? null);
  }, [user?.id, user?.municipality?.id]);
  useEffect(() => {
    // Filtros da exploração nunca atravessam usuário ou município.
    useTerritoryFilterStore.getState().reset();
  }, [user?.id, user?.municipality?.id]);
  useEffect(() => {
    if (!isReady) return;
    const userId = isAuthenticated && user?.id ? user.id : null;
    const municipalityId = user?.municipality?.id || DEFAULT_MUNICIPALITY_ID;
    // Salvos carregam de forma assíncrona: só então reenvia ao servidor.
    void useFollowStore
      .getState()
      .setScope(userId, municipalityId)
      .then(() => useNotificationStore.getState().resync());
    void usePlacesStore.getState().setScope(userId, municipalityId, user?.neighborhood || '');
    void useTerritoryStore
      .getState()
      .setScope(userId, municipalityId, user?.neighborhood || '');
  }, [
    isReady,
    isAuthenticated,
    user?.id,
    user?.municipality?.id,
    user?.neighborhood,
  ]);
  const appReady =
    themeReady && onboardingReady && isReady && (fontsLoaded || Boolean(fontError));
  // Toque num aviso, inclusive o que abriu o app: só navega depois que as telas
  // existem (antes, um toque com o app fechado podia se perder).
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledResponse = useRef<string | null>(null);
  useEffect(() => {
    if (!appReady || !lastResponse) return;
    const id = lastResponse.notification.request.identifier;
    if (handledResponse.current === id) return;
    handledResponse.current = id;
    const callId = lastResponse.notification.request.content.data?.callId;
    if (typeof callId === 'string' && callId)
      router.push({ pathname: '/(tabs)/TerritoryScreen', params: { focusId: callId } });
  }, [appReady, lastResponse]);
  useEffect(() => {
    if (appReady) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [appReady]);
  if (!appReady)
    return null;
  const base = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.canvas,
      card: colors.surface,
      text: colors.ink,
      border: colors.border,
      primary: colors.accent,
    },
  };
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ThemeProvider value={navigationTheme}>
            <BottomSheetModalProvider>
              <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <AppDrawer>
                  <CitizenStack authenticated={isAuthenticated} backgroundColor={colors.canvas} />
                </AppDrawer>
                <SignOutSheet />
                <OnboardingGate enabled={segments[0] !== 'OnboardingScreen'} />
                <AnimatedBrandSplash />
              </PersistQueryClientProvider>
            </BottomSheetModalProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
