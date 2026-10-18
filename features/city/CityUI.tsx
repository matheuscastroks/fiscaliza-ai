import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import type { CivicItem } from '@/shared/contracts';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { civicTerritory } from '@/shared/civic-territory';
import { RecordCard } from '@/components/ui/RecordCard';
import { assetUrl } from '@/services/http';
import { layout } from '@/theme/layout';
export const cityStyles = StyleSheet.create({
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
    <RecordCard
      title={item.title}
      label={kindLabel[item.kind] + ' · ' + statusLabel[item.status]}
      summary={item.summary}
      meta={
        (territory.scope === 'municipality'
          ? 'Todo o município'
          : territory.neighborhood) +
        (item.kind === 'consultation'
          ? ' · Até ' + new Date(item.closesAt).toLocaleDateString('pt-BR')
          : '')
      }
      image={
        item.kind === 'proposal' && item.images?.[0]
          ? assetUrl(item.images[0])
          : item.kind === 'action' && item.evidence[0]
            ? assetUrl(item.evidence[0])
            : undefined
      }
      onPress={() =>
        router.push({
          pathname: '/CivicDetailsScreen',
          params: { id: item.id },
        })
      }
      action={
        item.kind === 'consultation'
          ? 'Ver consulta'
          : item.kind === 'proposal'
            ? 'Ver proposta'
            : 'Ver ação'
      }
    >
      {item.kind === 'action' && (
        <View style={{ gap: spacing.xxs }}>
          <AppText variant="caption" color="muted">
            Execução: {item.progress}%
          </AppText>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel="Execução da ação pública"
            accessibilityValue={{ min: 0, max: 100, now: item.progress }}
            style={{ height: spacing.xxs, backgroundColor: colors.divider }}
          >
            <View
              style={{
                height: spacing.xxs,
                width: `${Math.max(0, Math.min(100, item.progress))}%`,
                backgroundColor:
                  item.status === 'completed'
                    ? colors.completed
                    : colors.accent,
              }}
            />
          </View>
        </View>
      )}
    </RecordCard>
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
