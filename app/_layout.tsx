import React, { useEffect } from 'react';
import { router, Stack, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useAuthStore } from '@/stores/authStore';
import { queryClient } from '@/services/http';
import { SideMenu } from '@/components/ui/SideMenu';
import { colors } from '@/theme/colors';
export default function RootLayout() {
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
  if (!isReady) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.canvas },
            }}
          />
          <SideMenu />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
