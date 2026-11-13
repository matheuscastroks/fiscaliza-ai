import { useState } from 'react';
import { View } from 'react-native';
import { create } from 'zustand';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { spacing } from '@/theme';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import {
  AppBottomSheetModal,
  BottomSheetView,
} from './AppBottomSheetModal';

export const useSignOutSheet = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({ open: false, setOpen: (open) => set({ open }) }));

export function SignOutSheet() {
  const { open, setOpen } = useSignOutSheet();
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <AppBottomSheetModal
      visible={open}
      onClose={() => {
        if (!busy) setOpen(false);
      }}
      enableDynamicSizing
      enablePanDownToClose={!busy}
      showHeader={false}
    >
      <BottomSheetView
        style={{
          paddingHorizontal: spacing.contentPadding,
          paddingTop: spacing.md,
          paddingBottom: Math.max(insets.bottom + spacing.md, spacing.xxl),
          gap: spacing.md,
        }}
      >
        <View style={{ gap: spacing.xs }}>
          <AppText variant="sectionTitle">Sair da conta?</AppText>
          <AppText color="muted">
            Quando você entrar de novo, seus chamados salvos voltam. Os lugares voltam se for neste celular.
          </AppText>
        </View>

        <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
          <AppButton
            title="Sair da conta"
            variant="destructive"
            loading={busy}
            onPress={() => {
              setBusy(true);
              void useAuthStore
                .getState()
                .logout()
                .catch(() => undefined)
                .finally(() => {
                  setBusy(false);
                  setOpen(false);
                });
            }}
          />
          <AppButton
            title="Continuar no app"
            variant="quiet"
            disabled={busy}
            onPress={() => setOpen(false)}
          />
        </View>
      </BottomSheetView>
    </AppBottomSheetModal>
  );
}
