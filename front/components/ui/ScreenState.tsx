import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { spacing } from '@/theme/spacing';
import { AppErrorMessage } from './AppErrorMessage';
import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';

export interface ScreenStateProps {
  loading?: boolean;
  error?: Error | null;
  retry?: () => unknown;
  /** Quando `empty` existe e não há loading/erro, mostra o vazio ilustrado com ação. */
  empty?: { title?: string; description: string; action?: { title: string; onPress: () => void } };
  children?: React.ReactNode;
}

/** Os quatro estados de uma leitura remota: carregando, erro recuperável, vazio e conteúdo. */
export function ScreenState({ loading, error, retry, empty, children }: ScreenStateProps) {
  const { colors } = useTheme();
  if (error) {
    return (
      <View accessibilityLiveRegion="polite" style={styles.box}>
        <AppErrorMessage
          message={error.message}
          onRetry={retry ? () => { void retry(); } : undefined}
        />
      </View>
    );
  }
  if (loading) {
    return (
      <View accessibilityLiveRegion="polite" style={styles.box}>
        <ActivityIndicator accessibilityLabel="Carregando" color={colors.accent} />
      </View>
    );
  }
  if (empty) {
    return (
      <View style={styles.box}>
        <IllustratedEmptyState title={empty.title} description={empty.description} action={empty.action} />
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({ box: { gap: spacing.sm, paddingVertical: spacing.md } });
