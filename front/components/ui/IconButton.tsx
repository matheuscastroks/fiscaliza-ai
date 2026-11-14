import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { elevation } from '@/theme/elevation';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface IconButtonProps {
  icon: IconName;
  /** Obrigatório: botão só com ícone precisa de nome acessível. */
  accessibilityLabel: string;
  onPress: () => void;
  /** `surface` claro, `ink` escuro (selecionado), `floating` claro com sombra sobre o mapa. */
  variant?: 'surface' | 'ink' | 'floating';
  disabled?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon, accessibilityLabel, onPress, variant = 'surface', disabled = false, selected, style,
}: IconButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const dark = variant === 'ink';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        dark ? styles.ink : styles.surface,
        variant === 'floating' && elevation.floating,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons name={icon} size={layout.iconSize.lg} color={dark ? colors.surface : colors.ink} />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      width: layout.touchTarget.minWidth,
      height: layout.touchTarget.minHeight,
      borderRadius: layout.radius.control,
      alignItems: 'center',
      justifyContent: 'center',
    },
    surface: { backgroundColor: colors.surface, borderWidth: layout.borderWidth.hairline, borderColor: colors.border },
    ink: { backgroundColor: colors.ink },
    pressed: { opacity: 0.75 },
    disabled: { opacity: 0.5 },
  });
