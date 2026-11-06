import { isPublicCitizenRoute } from '@/shared/citizen-navigation';
import {
  OnboardingGate,
  useOnboardingInitialization,
} from '@/features/onboarding/OnboardingGate';
import { useTheme, useThemeInitialization } from '@/theme/useTheme';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect } from 'react';
import {
  router,
  Stack,
  useSegments,
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useAuthStore } from '@/stores/authStore';
import { queryClient } from '@/services/http';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { SignOutSheet } from '@/components/ui/SignOutSheet';
import { useFollowStore } from '@/stores/followStore';
import { useTerritoryStore } from '@/stores/territoryStore';
import { usePlacesStore } from '@/stores/placesStore';

import {
  useFonts,
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
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
  const { isReady, isAuthenticated, initialize, user } = useAuthStore();
  const segments: readonly string[] = useSegments();
  useEffect(() => {
    void initialize();
  }, [initialize]);
  useEffect(() => {
    if (!isReady) return;
    const userId = isAuthenticated && user?.id ? user.id : null;
    const municipalityId = user?.municipality?.id || '3304557';
    void useFollowStore.getState().setScope(userId, municipalityId);
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
  useEffect(() => {
    if (!isReady) return;
    const topSegment = segments[0] || '';
    const isPublicRoute = isPublicCitizenRoute(segments);
    if (!isAuthenticated) {
      if (!isPublicRoute) router.replace('/LoginScreen');
      return;
    }
    if (
      !user?.municipality &&
      !isPublicRoute &&
      topSegment !== 'MunicipalityScreen'
    ) {
      router.replace('/MunicipalityScreen');
      return;
    }
    if (topSegment === 'LoginScreen' || topSegment === 'RegisterScreen') {
      router.replace(user?.municipality ? '/(tabs)' : '/MunicipalityScreen');
    }
  }, [isReady, isAuthenticated, segments, user?.municipality]);
  if (!themeReady || !onboardingReady || !isReady || (!fontsLoaded && !fontError))
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
            <QueryClientProvider client={queryClient}>
              <StatusBar style={isDark ? 'light' : 'dark'} />
              <AppDrawer>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.canvas },
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Protected guard={isReady && isAuthenticated}>
                    <Stack.Screen name="MunicipalityScreen" />
                  </Stack.Protected>
                </Stack>
              </AppDrawer>
              <SignOutSheet />
              <OnboardingGate enabled={segments[0] !== 'OnboardingScreen'} />
            </QueryClientProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
