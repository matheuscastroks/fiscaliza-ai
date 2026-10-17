import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Problem } from '@/data/mockData';
import { useAuthStore } from '@/stores/authStore';
import { useProblemsStore } from '@/stores/problemsStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppDivider } from '@/components/ui/AppDivider';
import { OccurrenceRow } from '@/components/occurrences/OccurrenceRow';
import { StatusFilterOption } from '@/features/map/useOccurrenceFilters';

const STATUS_FILTERS: { id: StatusFilterOption; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Recebidas' },
  { id: 'in_progress', label: 'Em atendimento' },
  { id: 'resolved', label: 'Concluídas' },
];

export default function HistoryScreen() {
  const { user } = useAuthStore();
  const userId = user?.id || 'demo-citizen';
  const { problems, loadProblems, isLoading } = useProblemsStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  const userProblems = problems.filter((p) => p.reportedBy === userId);
  const filteredProblems = userProblems.filter((p) => {
    if (statusFilter === 'all') return true;
    return p.status === statusFilter;
  });

  const renderItem = ({ item }: { item: Problem }) => (
    <OccurrenceRow
      problem={item}
      onPress={() => router.push(`/ProblemDetailsScreen?id=${item.id}`)}
    />
  );

  return (
    <AppScreen edges={['top']} style={styles.screen}>
      <AppHeader
        title="Meus Relatos"
        context="Vila Esperança · histórico documental"
        onBack={() => router.back()}
      />

      {/* Filtros de Status */}
      <View style={styles.filtersBar}>
        <View style={styles.chipsRow}>
          {STATUS_FILTERS.map((item) => {
            const isSelected = statusFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
                onPress={() => setStatusFilter(item.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <AppText
                  variant="caption"
                  color={isSelected ? 'white' : 'muted'}
                  style={styles.chipText}
                >
                  {item.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <AppDivider />

      {/* Listagem */}
      {isLoading && userProblems.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
          <AppText variant="caption" color="muted" style={styles.loadingText}>
            Carregando histórico...
          </AppText>
        </View>
      ) : (
        <FlatList
          data={filteredProblems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshing={isLoading}
          onRefresh={loadProblems}
          contentContainerStyle={filteredProblems.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={40} color={colors.subtle} />
              <AppText variant="label" color="ink" style={styles.emptyTitle}>
                Nenhum relato encontrado
              </AppText>
              <AppText variant="body" color="muted" style={styles.emptyDescription}>
                Você não possui ocorrências com este status no ambiente de demonstração.
              </AppText>
              <AppButton
                title="Registrar nova ocorrência"
                variant="primary"
                onPress={() => router.push('/(tabs)/ReportScreen')}
                style={styles.emptyCta}
              />
            </View>
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  filtersBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.contentPadding,
    paddingVertical: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    columnGap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: layout.radius.pill,
    backgroundColor: colors.surfaceSubdued,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
  },
  filterChipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipText: {
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.xs,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    minHeight: 320,
  },
  emptyTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  emptyCta: {
    minWidth: 180,
  },
});