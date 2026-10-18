import { useTheme } from '@/theme/useTheme';
import type { ReactNode } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
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

  const { width, height } = useWindowDimensions();
  return (
    <BottomSheet
      isPresented={open}
      onDismiss={() => {
        if (!busy) onClose();
      }}
      shouldDismissOnBackPress={!busy}
      shouldDismissOnClickOutside={!busy}
      snapPoints={scroll && Platform.OS !== 'web' ? ['full'] : undefined}
      containerColor={colors.surface}
      contentPadding={{
        left: spacing.contentPadding,
        right: spacing.contentPadding,
        bottom: spacing.xl,
      }}
    >
      <RNHostView
        matchContents={
          scroll && Platform.OS !== 'web' ? false : { vertical: true }
        }
      >
        {scroll ? (
          <KeyboardAwareScrollView
            style={{
              ...(Platform.OS === 'web'
                ? { maxHeight: height * 0.75 }
                : { flex: 1 }),
              width:
                Platform.OS === 'web'
                  ? '100%'
                  : Math.min(width, 640) - 2 * spacing.contentPadding,
            }}
            contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.sm }}
          >
            {children}
          </KeyboardAwareScrollView>
        ) : (
          <View
            style={{
              gap: spacing.sm,
              paddingTop: spacing.sm,
              width:
                Platform.OS === 'web'
                  ? '100%'
                  : Math.min(width, 640) - 2 * spacing.contentPadding,
            }}
          >
            {children}
          </View>
        )}
      </RNHostView>
    </BottomSheet>
  );
}
