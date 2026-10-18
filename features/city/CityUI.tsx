import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import type { CivicItem } from '@/shared/contracts';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { civicTerritory } from '@/shared/civic-territory';
export const cityStyles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 110, gap: 20 },
  section: { gap: spacing.sm },
  row: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.divider,
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
    <TouchableOpacity
      style={cityStyles.row}
      onPress={() =>
        router.push({
          pathname: '/CivicDetailsScreen',
          params: { id: item.id },
        })
      }
      accessibilityRole="button"
      accessibilityLabel={
        item.title + ', ' + statusLabel[item.status] + ', ' + item.neighborhood
      }
    >
      <AppText variant="caption" color="accent">
        {kindLabel[item.kind]} · {statusLabel[item.status]}
      </AppText>
      <AppText variant="sectionTitle">{item.title}</AppText>
      <AppText color="muted">{item.summary}</AppText>
      <AppText variant="caption" color="muted">
        {territory.scope === 'municipality'
          ? 'Todo o município'
          : territory.neighborhood}
        {item.kind === 'consultation'
          ? ' · Até ' + new Date(item.closesAt).toLocaleDateString('pt-BR')
          : ''}
      </AppText>
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
    </TouchableOpacity>
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
