import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { UserAvatar } from './UserAvatar';
import { useAuthStore } from '@/stores/authStore';
import React from 'react';
import {
  View,
  I18nManager,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
  hideUserAvatar?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  context,
  onBack,
  rightElement,
  overlay = false,
  hideUserAvatar = false,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const user = useAuthStore((state) => state.user);
  const titleAlignment = onBack && !rightElement ? styles.centered : undefined;

  return (
    <View
      style={[styles.container, overlay && styles.overlay]}
      pointerEvents={overlay ? 'box-none' : 'auto'}
    >
      <View style={styles.topRow} pointerEvents={overlay ? 'box-none' : 'auto'}>
        {!onBack && (
          <TouchableOpacity
            style={styles.circleButton}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              useMenu.getState().setOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
          >
            {user && !hideUserAvatar ? (
              <UserAvatar size={48} />
            ) : (
              <Ionicons name="menu-outline" size={layout.iconSize.md} color={colors.ink} accessible={false} />
            )}
          </TouchableOpacity>
        )}
        {onBack && (
          <TouchableOpacity
            style={styles.circleButton}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBack();
            }}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
              size={layout.iconSize.md}
              color={colors.ink}
              accessible={false}
            />
          </TouchableOpacity>
        )}
        <View
          style={styles.titleArea}
          pointerEvents={overlay ? 'none' : 'auto'}
        >
          <AppText
            variant="sectionTitle"
            color="ink"
            accessibilityRole="header"
            style={titleAlignment}
          >
            {title === 'Fiscaliza aí' ? (
              <>
                Fiscaliza{' '}
                <AppText
                  variant="sectionTitle"
                  style={{ color: colors.onSurfaceBrand }}
                >
                  aí
                </AppText>
              </>
            ) : (
              title
            )}
          </AppText>
          {context ? (
            <AppText variant="caption" color="muted" style={titleAlignment}>
              {context}
            </AppText>
          ) : null}
        </View>
        {rightElement ? (
          <View style={styles.rightArea}>{rightElement}</View>
        ) : onBack ? (
          <View style={{ width: layout.touchTarget.minWidth }} />
        ) : null}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      backgroundColor: colors.canvas,
      borderBottomWidth: 0,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: layout.touchTarget.minHeight,
      gap: spacing.sm,
    },
    circleButton: {
      width: layout.touchTarget.minWidth,
      height: layout.touchTarget.minHeight,
      borderRadius: layout.radius.card,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleArea: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
    },
    centered: { textAlign: 'center' },
    rightArea: {
      flexShrink: 0,
      marginLeft: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
