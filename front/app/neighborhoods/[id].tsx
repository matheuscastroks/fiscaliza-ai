import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { routeId } from '@/utils/routeId';
import Screen from '@/features/territory/NeighborhoodScreen';
export default function DetailRoute() {
  const params = useLocalSearchParams();
  const id = routeId(params.id);
  return id ? <Screen neighborhoodId={id} /> : <Redirect href="/+not-found" />;
}
