import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  Pressable,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import { spacing } from '@/theme';

export interface AppBottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  snapPoints?: (string | number)[];
  enablePanDownToClose?: boolean;
  enableDynamicSizing?: boolean;
  children?: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  headerRight?: React.ReactNode;
  showHeader?: boolean;
}

export {
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
  BottomSheetModal,
};

export const AppBottomSheetModal = forwardRef<BottomSheetModal, AppBottomSheetModalProps>(
  (
    {
      visible,
      onClose,
      title,
      snapPoints = ['55%', '85%'],
      enablePanDownToClose = true,
      enableDynamicSizing = false,
      children,
      contentContainerStyle,
      headerRight,
      showHeader = true,
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

    useEffect(() => {
      if (visible) {
        sheetRef.current?.present();
      } else {
        sheetRef.current?.dismiss();
      }
    }, [visible]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.45}
          pressBehavior="close"
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={enableDynamicSizing ? undefined : snapPoints}
        enablePanDownToClose={enablePanDownToClose}
        enableDynamicSizing={enableDynamicSizing}
        onDismiss={onClose}
        backdropComponent={renderBackdrop}
        keyboardBehavior="interactive"
        android_keyboardInputMode="adjustResize"
        backgroundStyle={[
          styles.sheetBackground,
          { backgroundColor: colors.surface },
        ]}
        handleIndicatorStyle={[
          styles.handleIndicator,
          { backgroundColor: colors.divider },
        ]}
      >
        <View
          style={[
            styles.container,
            { paddingBottom: Math.max(insets.bottom, spacing.md) },
            contentContainerStyle,
          ]}
        >
          {showHeader && (title || headerRight) ? (
            <View style={styles.header}>
              <AppText variant="sectionTitle" style={styles.headerTitle}>
                {title || ''}
              </AppText>
              <View style={styles.headerRightContainer}>
                {headerRight}
                <Pressable
                  onPress={onClose}
                  hitSlop={12}
                  style={[
                    styles.closeButton,
                    { backgroundColor: colors.surfaceSubdued },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar painel"
                >
                  <Ionicons name="close" size={18} color={colors.ink} />
                </Pressable>
              </View>
            </View>
          ) : null}
          {children}
        </View>
      </BottomSheetModal>
    );
  },
);

AppBottomSheetModal.displayName = 'AppBottomSheetModal';

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    width: 38,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.contentPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    flex: 1,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
