import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { goBack } from '@/utils/navigation';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { QueryState, createCityStyles } from '@/features/city/CityUI';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { useTerritorySelection } from '@/stores/territoryStore';
import {
  useOfficialCalls,
  useOfficialFilters,
  useOfficialOverview,
} from '@/features/city/useOfficialCalls';
import { OfficialCallRow } from '@/components/official/OfficialCallRow';
import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';
import { layout, spacing } from '@/theme';

export default function ResultsScreen() {
  const { colors } = useTheme();
  const cityStyles = useThemedStyles(createCityStyles);
  const styles = useThemedStyles(createStyles);
  const { neighborhood, setNeighborhood } = useTerritorySelection();
  const [pageLimit, setPageLimit] = useState(50);

  const officialFilters = useOfficialFilters();
  const overviewQuery = useOfficialOverview({
    bairro: neighborhood || undefined,
  });
  const closedOverviewQuery = useOfficialOverview({
    bairro: neighborhood || undefined,
    situacao: 'Encerrado',
  });
  const closedCallsQuery = useOfficialCalls({
    bairro: neighborhood || undefined,
    situacao: 'Encerrado',
    limit: pageLimit,
  });

  const bairroOptions = officialFilters.data?.bairros || [];
  const closedCalls = closedCallsQuery.data?.calls || [];
  const totalClosed = closedCallsQuery.data?.total ?? 0;
  const hasMore = Boolean(closedCallsQuery.data?.hasMore && pageLimit < 500);

  const overview = overviewQuery.data;
  const closedOverview = closedOverviewQuery.data;
  const totalCalls = overview?.totalCalls ?? 0;
  const resolutionRate =
    totalCalls > 0 ? Math.round(((overview?.closedCalls ?? 0) / totalCalls) * 100) : 0;
  const slaRate = overview?.withinDeadlineRate ?? 0;
  const withinDeadlineCount = overview?.withinDeadlineCount ?? 0;
  const overdueCount = overview?.overdueCount ?? 0;
  const statusBreakdown = closedOverview?.statusBreakdown || overview?.statusBreakdown || [];

  return (
    <AppScreen>
      <AppHeader
        title="Resultados e Prazos · 1746"
        context="Desfecho de atendimentos e SLA da Prefeitura do Rio"
        onBack={() => goBack()}
      />
      <ScrollView contentContainerStyle={cityStyles.content}>
        <View style={styles.headerRow}>
          <AppText variant="screenTitle" style={{ flex: 1 }}>
            {neighborhood || 'Todo o Rio de Janeiro'}
          </AppText>
          <NeighborhoodPicker
            compact
            options={bairroOptions}
            value={neighborhood}
            onChange={(val) => {
              setNeighborhood(val);
              setPageLimit(50);
            }}
          />
        </View>

        <AppText color="muted">
          Indicadores oficiais de conclusão, cumprimento da Carta de Serviços (SLA) e
          classificação de desfecho registrada pelos órgãos municipais no DATA.RIO.
        </AppText>

        {/* Painel de Indicadores de Desfecho e Cumprimento de Prazo */}
        {overview && overview.totalCalls > 0 && (
          <View style={styles.metricsCard}>
            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <AppText variant="caption" color="muted">
                  Taxa de conclusão
                </AppText>
                <AppText variant="screenTitle" style={{ fontSize: 22, color: colors.completed }}>
                  {resolutionRate}%
                </AppText>
                <AppText variant="caption" color="muted">
                  {(overview.closedCalls ?? 0).toLocaleString('pt-BR')} de{' '}
                  {totalCalls.toLocaleString('pt-BR')}
                </AppText>
              </View>

              <View style={styles.kpiBox}>
                <AppText variant="caption" color="muted">
                  Cumprimento de prazo
                </AppText>
                <AppText variant="screenTitle" style={{ fontSize: 22, color: colors.accent }}>
                  {slaRate}%
                </AppText>
                <AppText variant="caption" color="muted">
                  {withinDeadlineCount.toLocaleString('pt-BR')} no prazo ·{' '}
                  {overdueCount.toLocaleString('pt-BR')} fora
                </AppText>
              </View>
            </View>

            {statusBreakdown.length > 0 && (
              <View style={styles.breakdownSection}>
                <AppText variant="label" color="ink">
                  Desfecho operacional (status oficial 1746)
                </AppText>
                <View style={{ gap: spacing.xs }}>
                  {statusBreakdown.slice(0, 6).map((item) => {
                    const base = closedOverview?.totalCalls || overview.totalCalls || 1;
                    const pct = Math.min(100, Math.max(2, Math.round((item.count / base) * 100)));
                    return (
                      <View key={item.status} style={styles.breakdownRow}>
                        <View style={styles.breakdownLabelRow}>
                          <AppText variant="caption" color="ink" style={{ fontWeight: '600' }}>
                            {item.status}
                          </AppText>
                          <AppText variant="caption" color="muted">
                            {item.count.toLocaleString('pt-BR')} ({pct}%)
                          </AppText>
                        </View>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                width: `${pct}%`,
                                backgroundColor: colors.completed,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        <QueryState
          loading={closedCallsQuery.isPending}
          error={closedCallsQuery.error}
          retry={() => {
            void closedCallsQuery.refetch();
            void overviewQuery.refetch();
            void closedOverviewQuery.refetch();
          }}
        />

        {!closedCallsQuery.isPending &&
        !closedCallsQuery.error &&
        closedCalls.length === 0 ? (
          <IllustratedEmptyState
            kind="target"
            title="Nenhum chamado encerrado neste recorte"
            description={
              neighborhood
                ? 'Não há chamados encerrados sincronizados para este bairro no momento.'
                : 'Chamados encerrados pela prefeitura aparecerão aqui.'
            }
            action={
              neighborhood
                ? {
                    title: 'Ver todo o município',
                    onPress: () => setNeighborhood(''),
                  }
                : undefined
            }
          />
        ) : (
          closedCalls.length > 0 && (
            <View style={cityStyles.section}>
              <AppText variant="sectionTitle">
                Atendimentos 1746 encerrados ({totalClosed.toLocaleString('pt-BR')})
              </AppText>
              <View style={{ gap: spacing.xs }}>
                {closedCalls.map((call) => (
                  <OfficialCallRow
                    key={call.id}
                    call={call}
                    onPress={() =>
                      router.push({
                        pathname: '/OfficialCallDetailsScreen',
                        params: { id: call.id },
                      })
                    }
                  />
                ))}
              </View>
              {hasMore && (
                <AppButton
                  title={`Carregar mais (${closedCalls.length} de ${totalClosed.toLocaleString('pt-BR')})`}
                  variant="secondary"
                  onPress={() => setPageLimit((prev) => Math.min(500, prev + 100))}
                />
              )}
            </View>
          )
        )}
      </ScrollView>
    </AppScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    metricsCard: {
      backgroundColor: colors.surface,
      borderRadius: layout.radius.card,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.divider,
      gap: spacing.md,
    },
    kpiRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    kpiBox: {
      flex: 1,
      backgroundColor: colors.surfaceSubdued,
      borderRadius: layout.radius.panel,
      padding: spacing.md,
      gap: 2,
    },
    breakdownSection: {
      gap: spacing.xs,
    },
    breakdownRow: {
      gap: 4,
    },
    breakdownLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    barTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.surfaceSubdued,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 3,
    },
  });
