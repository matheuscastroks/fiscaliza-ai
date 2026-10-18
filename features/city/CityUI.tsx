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
export const cityStyles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40, gap: 20 },
  section: { gap: 12 },
  row: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 6,
  },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
        {item.neighborhood}
        {item.kind === 'consultation'
          ? ' · Até ' + new Date(item.closesAt).toLocaleDateString('pt-BR')
          : ''}
      </AppText>
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
