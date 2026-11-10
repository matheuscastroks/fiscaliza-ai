import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { AppText } from './AppText';

export type StatusTone = 'neutral' | 'info' | 'progress' | 'attention' | 'risk' | 'completed';

function palette(colors: ThemeColors, tone: StatusTone) {
  switch (tone) {
    case 'info': return { fg: colors.info, bg: colors.infoSurface };
    case 'progress': return { fg: colors.primary, bg: colors.primaryContainer };
    case 'attention': return { fg: colors.attention, bg: colors.attentionSurface };
    case 'risk': return { fg: colors.risk, bg: colors.riskSurface };
    case 'completed': return { fg: colors.completed, bg: colors.completedSurface };
    default: return { fg: colors.muted, bg: colors.surfaceSubdued };
  }
}

/** Situação sempre em texto; a cor só reforça. Use o rótulo publicado pelo servidor. */
export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: StatusTone }) {
  const { colors } = useTheme();
  const { fg, bg } = palette(colors, tone);
  return (
    <View style={[styles.base, { backgroundColor: bg }]}>
      <AppText variant="protocol" color={fg}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: layout.radius.pill,
  },
});
