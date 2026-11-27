import React from 'react';
import { Stack } from 'expo-router';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function CitizenStack({ authenticated, backgroundColor }: {
  authenticated: boolean;
  backgroundColor: string;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor },
      animation: reducedMotion ? 'none' : 'default',
    }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Protected guard={!authenticated}>
        <Stack.Screen name="LoginScreen" />
        <Stack.Screen name="RegisterScreen" />
      </Stack.Protected>
      <Stack.Protected guard={authenticated}>
        <Stack.Screen name="MunicipalityScreen" />
      </Stack.Protected>
    </Stack>
  );
}
