import type { ThemeColors } from '@/theme/colors';
import { StyleSheet } from 'react-native';

import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
export const createCityStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      padding: spacing.contentPadding,
      paddingBottom: 120,
      gap: spacing.xl,
    },
    section: { gap: spacing.md },
    row: {
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: layout.radius.panel,
      gap: spacing.xs,
    },
    controls: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    description: { lineHeight: 24 },
  });
