import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Rota inicial unificada com a experiência Map-First em TerritoryScreen.
 */
export default function HomeScreen() {
  return <Redirect href="/(tabs)/TerritoryScreen" />;
}
