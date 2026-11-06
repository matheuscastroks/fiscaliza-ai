import { useState } from 'react';
import { create } from 'zustand';
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

  return (
    <AppBottomSheetModal
      visible={open}
      onClose={() => {
        if (!busy) setOpen(false);
      }}
      enableDynamicSizing
      enablePanDownToClose={!busy}
      showHeader={false}
      contentContainerStyle={{
        paddingHorizontal: spacing.contentPadding,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xl,
      }}
    >
      <BottomSheetView
        style={{
          gap: spacing.sm,
        }}
      >
        <AppText variant="sectionTitle">Sair da conta?</AppText>
        <AppText color="muted">
          Você precisará entrar novamente para participar.
        </AppText>
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
      </BottomSheetView>
    </AppBottomSheetModal>
  );
}
