import { useTheme } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import type { CivicItem } from '@/shared/contracts';

import { spacing } from '@/theme/spacing';
import { civicTerritory } from '@/shared/civic-territory';
import { CivicCard } from './CivicCard';
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
export const kindLabel = {
  proposal: 'Proposta',
  consultation: 'Consulta pública',
  action: 'Ação pública',
};
export const statusLabel: Record<string, string> = {
  submitted: 'Recebida',
  under_review: 'Em análise',
  accepted: 'Acolhida',
  declined: 'Não acolhida',
  open: 'Participação aberta',
  closed: 'Encerrada',
  planned: 'Programada',
  in_progress: 'Em andamento',
  completed: 'Concluída',
};
export function CivicRow({ item }: { item: CivicItem }) {
  const territory = civicTerritory(item);
  return (
    <CivicCard
      item={item}
      status={statusLabel[item.status]}
      territory={
        territory.scope === 'municipality'
          ? 'Todo o município'
          : territory.neighborhood || 'Local indicado'
      }
      onPress={() =>
        router.push({
          pathname: '/CivicDetailsScreen',
          params: { id: item.id },
        })
      }
    />
  );
}

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
        <>
          <AppText color="risk">{error.message}</AppText>
          <AppButton
            title="Tentar novamente"
            variant="secondary"
            onPress={() => {
              retry?.();
            }}
          />
        </>
      )}
    </View>
  );
}
