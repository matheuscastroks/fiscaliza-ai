import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { AppText } from './AppText';
import { IconTile } from './IconTile';
import { Surface } from './Surface';
import type { IconName } from './IconButton';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  tone?: 'primary' | 'neutral' | 'risk';
  trailing?: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}

/** Linha com ícone, título, subtítulo e chevron; use dentro de `InsetGroup`. */
export function ListRow({ title, subtitle, icon, tone, trailing, onPress, accessibilityLabel }: ListRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const content = (
    <>
      {icon ? <IconTile icon={icon} tone={tone} /> : null}
      <View style={styles.text}>
        <AppText variant="label" color={tone === 'risk' ? 'risk' : 'ink'}>{title}</AppText>
        {subtitle ? <AppText variant="meta" color="muted">{subtitle}</AppText> : null}
      </View>
      {trailing}
      {onPress ? <Ionicons name="chevron-forward" size={layout.iconSize.md} color={colors.subtle} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || [title, subtitle].filter(Boolean).join('. ')}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

/** Grupo de linhas com divisórias, num único Surface plano. */
export function InsetGroup({ children }: { children: React.ReactNode }) {
  const styles = useThemedStyles(createStyles);
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <Surface padded={false}>
      {items.map((child, index) => (
        <React.Fragment key={index}>
          {index > 0 ? <View style={styles.divider} /> : null}
          {child}
        </React.Fragment>
      ))}
    </Surface>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: layout.touchTarget.minHeight + spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    text: { flex: 1, gap: spacing.xxs / 2 },
    pressed: { backgroundColor: colors.surfaceSubdued },
    divider: { height: layout.borderWidth.hairline, backgroundColor: colors.divider, marginLeft: spacing.md },
  });
