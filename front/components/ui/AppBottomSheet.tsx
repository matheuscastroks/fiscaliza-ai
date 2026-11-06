import type { ReactNode } from 'react';
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
      contentContainerStyle={{
        paddingHorizontal: spacing.contentPadding,
        paddingTop: spacing.xs,
        paddingBottom: spacing.xl,
      }}
    >
      {scroll ? (
        <BottomSheetScrollView
          contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.xs }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView style={{ gap: spacing.sm, paddingTop: spacing.xs }}>
          {children}
        </BottomSheetView>
      )}
    </AppBottomSheetModal>
  );
}
