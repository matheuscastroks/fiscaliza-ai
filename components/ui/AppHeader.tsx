import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppText } from './AppText';
import { useMenu } from './SideMenu';

export interface AppHeaderProps {
  title: string;
  context?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  overlay?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  context,
  onBack,
  rightElement,
  overlay = false,
}) => {
  return (
    <View
      style={[styles.container, overlay && styles.overlay]}
      pointerEvents={overlay ? 'box-none' : 'auto'}
    >
      <View style={styles.topRow} pointerEvents={overlay ? 'box-none' : 'auto'}>
        {!onBack && (
          <TouchableOpacity
            style={styles.circleButton}
            onPress={() => useMenu.getState().setOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
          >
            <Ionicons name="menu-outline" size={22} color={colors.ink} />
          </TouchableOpacity>
        )}
        {onBack && (
          <TouchableOpacity
            style={styles.circleButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </TouchableOpacity>
        )}
        <View
          style={styles.titleArea}
          pointerEvents={overlay ? 'none' : 'auto'}
        >
          <AppText
            variant="sectionTitle"
            color="ink"
            numberOfLines={1}
            style={onBack ? { textAlign: 'center' } : undefined}
          >
            {title}
          </AppText>
          {context ? (
            <AppText variant="caption" color="muted" numberOfLines={1}>
              {context}
            </AppText>
          ) : null}
        </View>
        {rightElement ? (
          <View style={styles.rightArea}>{rightElement}</View>
        ) : onBack ? (
          <View style={{ width: 48 }} />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 8,
    zIndex: 2,
    backgroundColor: colors.transparent,
  },
  container: {
    paddingHorizontal: spacing.contentPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.canvas,
    borderBottomWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.touchTarget.minHeight,
  },
  // Botões circulares brancos com sombra sutil da referência
  circleButton: {
    marginRight: spacing.sm,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: {
    flex: 1,
    justifyContent: 'center',
  },
  rightArea: {
    marginLeft: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
