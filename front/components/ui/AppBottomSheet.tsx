import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/theme';
import {
  AppBottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from './AppBottomSheetModal';

export function AppBottomSheet({
  open,
  onClose,
  children,
  busy = false,
  scroll = false,
  snapPoints,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
  scroll?: boolean;
  snapPoints?: (string | number)[];
}) {
  const insets = useSafeAreaInsets();

  return (
    <AppBottomSheetModal
      visible={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      enablePanDownToClose={!busy}
      enableDynamicSizing={!scroll && !snapPoints}
      snapPoints={snapPoints || (scroll ? ['65%', '90%'] : undefined)}
      showHeader={false}
    >
      {scroll ? (
        <BottomSheetScrollView
          contentContainerStyle={{
            gap: spacing.sm,
            paddingHorizontal: spacing.contentPadding,
            paddingTop: spacing.md,
            paddingBottom: Math.max(insets.bottom + spacing.md, spacing.xxl),
          }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView
          style={{
            gap: spacing.sm,
            paddingHorizontal: spacing.contentPadding,
            paddingTop: spacing.md,
            paddingBottom: Math.max(insets.bottom + spacing.md, spacing.xxl),
          }}
        >
          {children}
        </BottomSheetView>
      )}
    </AppBottomSheetModal>
  );
}
