import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { goBack } from '@/utils/navigation';

export default function OnboardingScreen() {
  return (
    <OnboardingFlow
      replay
      onFinish={async () => {
        await useOnboardingStore.getState().complete();
        goBack();
      }}
    />
  );
}
