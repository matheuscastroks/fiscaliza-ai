import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';

export interface SurfaceProps extends ViewProps {
  /** `card` para conteúdo; `panel` para blocos maiores. Sem sombra, e não aninhe Surface. */
  radius?: 'card' | 'panel';
  padded?: boolean;
}

export function Surface({ radius = 'panel', padded = true, style, ...rest }: SurfaceProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View
      style={[styles.base, radius === 'card' ? styles.card : styles.panel, padded && styles.padded, style]}
      {...rest}
    />
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      backgroundColor: colors.surface,
      borderWidth: layout.borderWidth.hairline,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    card: { borderRadius: layout.radius.card },
    panel: { borderRadius: layout.radius.panel },
    padded: { padding: spacing.md },
  });
