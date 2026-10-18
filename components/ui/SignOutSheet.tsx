import { useTheme } from '@/theme/useTheme';
import { useState } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { BottomSheet, RNHostView } from '@expo/ui';
import { create } from 'zustand';
import { useAuthStore } from '@/stores/authStore';
import { spacing } from '@/theme';
import { AppText } from './AppText';
import { AppButton } from './AppButton';

export const useSignOutSheet = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({ open: false, setOpen: (open) => set({ open }) }));

export function SignOutSheet() {
  const { colors } = useTheme();

  const { open, setOpen } = useSignOutSheet();
  const [busy, setBusy] = useState(false);
  const { width } = useWindowDimensions();
  return (
    <BottomSheet
      isPresented={open}
      onDismiss={() => {
        if (!busy) setOpen(false);
      }}
      shouldDismissOnBackPress={!busy}
      shouldDismissOnClickOutside={!busy}
      containerColor={colors.surface}
      contentPadding={{
        left: spacing.contentPadding,
        right: spacing.contentPadding,
        bottom: spacing.xl,
      }}
    >
      <RNHostView matchContents={{ vertical: true }}>
        <View
          style={{
            gap: spacing.sm,
            paddingTop: spacing.sm,
            width:
              Platform.OS === 'web'
                ? '100%'
                : Math.min(width, 640) - spacing.contentPadding * 2,
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
        </View>
      </RNHostView>
    </BottomSheet>
  );
}
