import React from 'react';
import { Stack } from 'expo-router';

export function CitizenStack({ authenticated, backgroundColor }: {
  authenticated: boolean;
  backgroundColor: string;
}) {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor } }}>
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
