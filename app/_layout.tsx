import { useOnboardingStore } from '@/stores/onboardingStore';
import {
  OnboardingGate,
  useOnboardingInitialization,
} from '@/features/onboarding/OnboardingGate';
import { useTheme, useThemeInitialization } from '@/theme/useTheme';
import * as SystemUI from 'expo-system-ui';
import { Platform } from 'react-native';
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
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useAuthStore } from '@/stores/authStore';
import { queryClient } from '@/services/http';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { SignOutSheet } from '@/components/ui/SignOutSheet';

import {
  useFonts,
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
  const { colors, isDark, mode } = useTheme();
  const themeReady = useThemeInitialization();
  const onboardingReady = useOnboardingInitialization();
  const onboardingCompleted = useOnboardingStore((state) => state.completed);
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.canvas).catch(() => undefined);
    if (Platform.OS === 'web')
      document.documentElement.style.colorScheme = mode;
  }, [colors.canvas, mode]);

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
    const topSegment = segments[0] || '';
    const subSegment = segments[1] || 'index';
    const isProtectedTab =
      topSegment === '(tabs)' &&
      ['ReportScreen', 'ProfileScreen'].includes(subSegment);
    const isPublicRoute =
      !isProtectedTab &&
      [
        '',
        '(tabs)',
        'OfficialCallDetailsScreen',
        'FacilityDetailsScreen',
        'ResultsScreen',
        'CityScreen',
        'LoginScreen',
        'AboutScreen',
        'HelpScreen',
        'OnboardingScreen',
      ].includes(topSegment);

    if (isReady && !isAuthenticated && !isPublicRoute)
      router.replace('/LoginScreen');
    else if (
      isReady &&
      isAuthenticated &&
      !user?.municipality &&
      !isPublicRoute &&
      topSegment !== 'MunicipalityScreen'
    )
      router.replace('/MunicipalityScreen');
  }, [isReady, isAuthenticated, segments, user?.municipality]);
  if (
    !themeReady ||
    !onboardingReady ||
    (!isReady && onboardingCompleted) ||
    (!fontsLoaded && !fontError)
  )
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
                <Stack.Screen
                  name="ProblemDetailsScreen"
                  options={{ animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                  name="CivicDetailsScreen"
                  options={{ animation: 'slide_from_bottom' }}
                />
              </Stack>
            </AppDrawer>
            <SignOutSheet />
            <OnboardingGate enabled={segments[0] !== 'OnboardingScreen'} />
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
