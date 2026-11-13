import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { AppText } from './AppText';
import type { IconName } from './IconButton';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
}

/** Filtro: claro em repouso, escuro quando selecionado. */
export function Chip({ label, selected = false, onPress, icon, disabled = false }: ChipProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const foreground = selected ? colors.surface : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      hitSlop={spacing.xxs}
      onPress={onPress}
      style={({ pressed }) => [styles.base, selected ? styles.selected : styles.idle, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <View style={styles.row}>
        {icon ? <Ionicons name={icon} size={layout.iconSize.sm} color={foreground} /> : null}
        <AppText variant="label" color={foreground}>{label}</AppText>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      minHeight: layout.touchTarget.minHeight - spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: layout.radius.compact,
      justifyContent: 'center',
      borderWidth: layout.borderWidth.hairline,
    },
    idle: { backgroundColor: colors.surface, borderColor: colors.border },
    selected: { backgroundColor: colors.ink, borderColor: colors.ink },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
    pressed: { opacity: 0.75 },
    disabled: { opacity: 0.5 },
  });
