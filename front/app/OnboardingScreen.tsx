import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow';
import { goBack } from '@/utils/navigation';

export default function OnboardingScreen() {
  return (
    <OnboardingFlow
      replay
      onFinish={() => goBack()}
    />
  );
}
