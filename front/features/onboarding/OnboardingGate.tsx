import { useEffect } from 'react';
import { Modal, View } from 'react-native';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useTheme } from '@/theme/useTheme';
import { OnboardingFlow } from './OnboardingFlow';

export function useOnboardingInitialization() {
  const initialize = useOnboardingStore((state) => state.initialize);
  const ready = useOnboardingStore((state) => state.hydrated);
  useEffect(() => {
    void initialize();
  }, [initialize]);
  return ready;
}

/** Overlay the existing entry route; auth and CEP keep their original destinations. */
export function OnboardingGate() {
  const { colors } = useTheme();
  const completed = useOnboardingStore((state) => state.completed);
  const ready = useOnboardingStore((state) => state.hydrated);
  const complete = useOnboardingStore((state) => state.complete);
  return (
    <Modal
      visible={ready && !completed}
      animationType="none"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <OnboardingFlow onFinish={complete} />
      </View>
    </Modal>
  );
}
