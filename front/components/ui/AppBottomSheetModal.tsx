import React, { forwardRef, useCallback, useMemo, useRef } from 'react';

import {
  Modal,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  Pressable,
} from 'react-native';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

import { spacing } from '@/theme';

import { fontSizes } from '@/theme/typography';

import { layout } from '@/theme/layout';


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
  backdropOpacity?: number;
}

export {
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
  BottomSheet,
};

export const AppBottomSheetModal = forwardRef<BottomSheet, AppBottomSheetModalProps>(
  (
    {
      visible,
      onClose,
      title,
      snapPoints: rawSnapPoints = ['55%', '85%'],
      enablePanDownToClose = true,
      enableDynamicSizing = false,
      children,
      contentContainerStyle,
      headerRight,
      showHeader = true,
      backdropOpacity = 0.45,
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const sheetRef = useRef<BottomSheet>(null);

    const snapPoints = useMemo(
      () => rawSnapPoints,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [JSON.stringify(rawSnapPoints)],
    );

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1) {
          onClose();
        }
      },
      [onClose],
    );

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={backdropOpacity}
          pressBehavior="close"
        />
      ),
      [backdropOpacity],
    );

    if (!visible) return null;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <GestureHandlerRootView style={StyleSheet.absoluteFill}>
          <BottomSheet
            ref={ref || sheetRef}
            index={0}
            snapPoints={enableDynamicSizing ? undefined : snapPoints}
            enablePanDownToClose={enablePanDownToClose}
            enableDynamicSizing={enableDynamicSizing}
            onChange={handleSheetChanges}
            onClose={onClose}
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
                      <Ionicons name="close" size={layout.iconSize.md} color={colors.ink} />
                    </Pressable>
                  </View>
                </View>
              ) : null}
              {children}
            </View>
          </BottomSheet>
        </GestureHandlerRootView>
      </Modal>
    );
  },
);

AppBottomSheetModal.displayName = 'AppBottomSheetModal';

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: layout.radius.card,
    borderTopRightRadius: layout.radius.card,
  },
  handleIndicator: {
    width: 38,
    height: 4,
    borderRadius: layout.radius.xs,
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
    fontSize: fontSizes.sectionTitle,
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
    borderRadius: layout.radius.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
