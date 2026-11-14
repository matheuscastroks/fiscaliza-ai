import React from 'react';
import { FacilityDetails } from '@/components/territory/FacilityDetails';
import { goBack } from '@/utils/navigation';
export default function FacilityDetailsScreen({ id }: { id: string }) {
  return <FacilityDetails id={id} onBack={() => goBack()} />;
}
