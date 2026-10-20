import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { FacilityDetails } from '@/components/territory/FacilityDetails';
import { goBack } from '@/utils/navigation';
export default function FacilityDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FacilityDetails id={id} onBack={() => goBack()} />;
}
