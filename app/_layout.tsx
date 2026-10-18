import React, { useEffect } from 'react';
import { router, Stack, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useAuthStore } from '@/stores/authStore';
import { queryClient } from '@/services/http';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { SignOutSheet } from '@/components/ui/SignOutSheet';
import { colors } from '@/theme/colors';
import {
  useFonts,
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  });
  const { isReady, isAuthenticated, initialize, user } = useAuthStore();
  const segments = useSegments();
  useEffect(() => {
    void initialize();
  }, [initialize]);
  useEffect(() => {
    const publicRoute = ['LoginScreen', 'AboutScreen', 'HelpScreen'].includes(
      segments[0] || '',
    );
    if (isReady && !isAuthenticated && !publicRoute)
      router.replace('/LoginScreen');
    else if (
      isReady &&
      isAuthenticated &&
      !user?.municipality &&
      !publicRoute &&
      segments[0] !== 'MunicipalityScreen'
    )
      router.replace('/MunicipalityScreen');
  }, [isReady, isAuthenticated, segments, user?.municipality]);
  if (!isReady || (!fontsLoaded && !fontError)) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
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
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
