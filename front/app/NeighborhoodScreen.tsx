import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { routeId } from '@/utils/routeId';
export default function LegacyRoute() {
  const params = useLocalSearchParams();
  const id = routeId(params.neighborhoodId);
  return <Redirect href={id ? { pathname: '/neighborhoods/[id]', params: { id } } : '/neighborhoods'} />;
}
