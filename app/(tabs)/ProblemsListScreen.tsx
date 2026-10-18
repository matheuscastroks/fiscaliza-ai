import { SlidingTabs } from '@/components/ui/SlidingTabs';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Problem } from '@/data/mockData';
import { useProblemsStore } from '@/stores/problemsStore';
import { useAuthStore } from '@/stores/authStore';

import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppDivider } from '@/components/ui/AppDivider';
import { OccurrenceRow } from '@/components/occurrences/OccurrenceRow';
import {
  useOccurrenceFilters,
  StatusFilterOption,
} from '@/features/map/useOccurrenceFilters';

const STATUS_FILTERS: { id: StatusFilterOption; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Recebidas' },
  { id: 'in_progress', label: 'Em atendimento' },
  { id: 'resolved', label: 'Concluídas' },
];

export default function ProblemsListScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const municipality = useAuthStore((state) => state.user?.municipality);
  const { problems, loadProblems, isLoading } = useProblemsStore();
  const [sortOrder, setSortOrder] = useState<'recent' | 'votes'>('recent');

  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredProblems,
    clearFilters,
  } = useOccurrenceFilters(problems);

  useEffect(() => {
    if (municipality) void loadProblems();
  }, [loadProblems, municipality]);

  const sortedProblems = [...filteredProblems].sort((a, b) => {
    if (sortOrder === 'votes') {
      return (b.votes || 0) - (a.votes || 0);
    }
    const dateA = new Date(a.reportedAt || 0).getTime();
    const dateB = new Date(b.reportedAt || 0).getTime();
    return dateB - dateA;
  });

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'recent' ? 'votes' : 'recent'));
  };

  const renderItem = ({ item }: { item: Problem }) => (
    <OccurrenceRow
      problem={item}
      onPress={() => router.push(`/ProblemDetailsScreen?id=${item.id}`)}
    />
  );

  return (
    <AppScreen edges={['top']} style={styles.screen}>
      {/* Cabeçalho da Lista */}
      <View style={styles.header}>
        <AppText variant="caption" color="muted">
          {municipality?.name} · registros municipais
        </AppText>
        <AppText variant="screenTitle" color="ink">
          Ocorrências
        </AppText>
      </View>

      {/* Campo de Busca Funcional */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.subtle}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por local ou tipo de problema"
            placeholderTextColor={colors.subtle}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Linha de Filtros e Ordenação */}
      <View style={styles.filterRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <SlidingTabs
            edgeToEdge={false}
            label="Filtrar ocorrências"
            options={STATUS_FILTERS.map((option) => ({
              value: option.id,
              label: option.label,
            }))}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as StatusFilterOption)}
          />
        </View>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={toggleSortOrder}
          accessibilityRole="button"
          accessibilityLabel={`Ordenar por: ${sortOrder === 'recent' ? 'Mais recentes' : 'Mais apoiados'}`}
        >
          <Ionicons
            name="swap-vertical-outline"
            size={16}
            color={colors.accent}
          />
          <AppText variant="caption" color="accent" style={styles.sortText}>
            {sortOrder === 'recent' ? 'Recentes' : 'Apoiados'}
          </AppText>
        </TouchableOpacity>
      </View>

      <AppDivider />

      {/* Listagem de Ocorrências */}
      {isLoading && problems.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
          <AppText variant="caption" color="muted" style={styles.loadingText}>
            Carregando ocorrências...
          </AppText>
        </View>
      ) : (
        <FlatList
          data={sortedProblems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshing={isLoading}
          onRefresh={loadProblems}
          contentContainerStyle={
            sortedProblems.length === 0 ? styles.emptyContainer : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="file-tray-outline"
                size={36}
                color={colors.subtle}
              />
              <AppText variant="label" color="ink" style={styles.emptyTitle}>
                Nenhuma ocorrência encontrada
              </AppText>
              <AppText
                variant="body"
                color="muted"
                style={styles.emptyDescription}
              >
                Não há registros com os critérios informados. Tente remover
                filtros ou ajustar o termo de busca.
              </AppText>
              {statusFilter !== 'all' || searchQuery ? (
                <TouchableOpacity
                  onPress={clearFilters}
                  style={styles.clearFiltersButton}
                >
                  <AppText variant="label" color="accent">
                    Limpar filtros
                  </AppText>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}
    </AppScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      backgroundColor: colors.canvas,
    },
    header: {
      paddingHorizontal: spacing.contentPadding,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs,
      backgroundColor: colors.surface,
    },
    searchContainer: {
      paddingHorizontal: spacing.contentPadding,
      paddingVertical: spacing.xs,
      backgroundColor: colors.surface,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubdued,
      borderWidth: layout.borderWidth.hairline,
      borderColor: colors.divider,
      borderRadius: layout.radius.button,
      paddingHorizontal: spacing.sm,
      minHeight: layout.touchTarget.minHeight,
    },
    searchIcon: {
      marginRight: spacing.xs,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.ink,
      paddingVertical: spacing.xs,
    },
    filterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.contentPadding,
      paddingVertical: spacing.xs,
      backgroundColor: colors.surface,
    },
    chipsGroup: {
      flexDirection: 'row',
      columnGap: spacing.xs,
      flex: 1,
    },
    filterChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
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
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xxs,
      paddingHorizontal: spacing.xs,
      marginLeft: spacing.xs,
    },
    sortText: {
      marginLeft: spacing.xxs,
      fontWeight: '500',
    },
    loadingContainer: {
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
      minHeight: 280,
    },
    emptyTitle: {
      marginTop: spacing.sm,
      marginBottom: spacing.xxs,
    },
    emptyDescription: {
      textAlign: 'center',
      lineHeight: 20,
    },
    clearFiltersButton: {
      marginTop: spacing.md,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
  });
