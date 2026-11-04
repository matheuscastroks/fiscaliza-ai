import { useTheme } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppErrorMessage } from '@/components/ui/AppErrorMessage';

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
export function QueryState({
  loading,
  error,
  retry,
}: {
  loading?: boolean;
  error?: Error | null;
  retry?: () => unknown;
}) {
  const { colors } = useTheme();

  return (
    <View accessibilityLiveRegion="polite" style={{ gap: 12 }}>
      {loading && (
        <ActivityIndicator
          accessibilityLabel="Carregando"
          color={colors.accent}
        />
      )}
      {error && (
        <AppErrorMessage
          message={error.message}
          onRetry={
            retry
              ? () => {
                  void retry();
                }
              : undefined
          }
        />
      )}
    </View>
  );
}
