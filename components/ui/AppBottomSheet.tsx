import { useTheme } from '@/theme/useTheme';
import type { ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { BottomSheet, RNHostView } from '@expo/ui';
import { spacing } from '@/theme';
import { KeyboardAwareScrollView } from './KeyboardAwareScrollView';

export function AppBottomSheet({
  open,
  onClose,
  children,
  busy = false,
  scroll = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
  scroll?: boolean;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 640) - 2 * spacing.contentPadding;

  return (
    <BottomSheet
      isPresented={open}
      onDismiss={() => {
        if (!busy) onClose();
      }}
      shouldDismissOnBackPress={!busy}
      shouldDismissOnClickOutside={!busy}
      snapPoints={scroll ? ['full'] : undefined}
      containerColor={colors.surface}
      contentPadding={{
        left: spacing.contentPadding,
        right: spacing.contentPadding,
        bottom: spacing.xl,
      }}
    >
      <RNHostView matchContents={scroll ? false : { vertical: true }}>
        {scroll ? (
          <KeyboardAwareScrollView
            style={{ flex: 1, width: contentWidth }}
            contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.sm }}
          >
            {children}
          </KeyboardAwareScrollView>
        ) : (
          <View
            style={{
              gap: spacing.sm,
              paddingTop: spacing.sm,
              width: contentWidth,
            }}
          >
            {children}
          </View>
        )}
      </RNHostView>
    </BottomSheet>
  );
}
