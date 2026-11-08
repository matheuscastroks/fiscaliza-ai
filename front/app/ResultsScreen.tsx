import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { goBack } from '@/utils/navigation';
import React, { useState, useMemo } from 'react';
import { FlatList, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { SlidingTabs } from '@/components/ui/SlidingTabs';
import { QueryState, createCityStyles } from '@/features/city/CityUI';
import { breakdownShare } from '@/features/city/resultBreakdown';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { useTerritorySelection } from '@/stores/territoryStore';
import {
  useInfiniteOfficialCalls,
  useOfficialFilters,
  useOfficialOverview,
} from '@/features/city/useOfficialCalls';
import { OfficialCallRow } from '@/components/official/OfficialCallRow';
import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';
import { resolveOfficialCallDeadline } from '@/features/city/officialCallStatus';
import { layout, spacing } from '@/theme';

type SlaFilter = 'all' | 'on_time' | 'overdue';

function getStatusSemanticColor(status: string, colors: ThemeColors): string {
  const normalized = status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (
    normalized.includes('atendido') ||
    normalized.includes('fechado com solucao') ||
    normalized.includes('procedente') ||
    normalized.includes('concluido') ||
    normalized.includes('executado')
  ) {
    return colors.completed;
  }
  if (
    normalized.includes('vistoriado') ||
    normalized.includes('em analise') ||
    normalized.includes('orientado') ||
    normalized.includes('encaminhado')
  ) {
    return colors.primary;
  }
  if (
    normalized.includes('cancelado') ||
    normalized.includes('improcedente') ||
    normalized.includes('sem possibilidade') ||
    normalized.includes('indeferido')
  ) {
    return colors.risk;
  }
  return colors.attention;
}

export default function ResultsScreen() {
  const { colors, isDark } = useTheme();
  const cityStyles = useThemedStyles(createCityStyles);
  const styles = useThemedStyles(createStyles);
  const { neighborhood, setNeighborhood } = useTerritorySelection();

  const [slaFilter, setSlaFilter] = useState<SlaFilter>('all');

  const officialFilters = useOfficialFilters();
  const overviewQuery = useOfficialOverview({
    bairro: neighborhood || undefined,
  });
  const closedOverviewQuery = useOfficialOverview({
    bairro: neighborhood || undefined,
    situacao: 'Encerrado',
  });
  const cityOverviewQuery = useOfficialOverview(
    undefined,
    Boolean(neighborhood),
  );

  const closedCallsQuery = useInfiniteOfficialCalls({
    bairro: neighborhood || undefined,
    situacao: 'Encerrado',
    limit: 50,
  });

  const bairroOptions = officialFilters.data?.bairros || [];
  const closedCalls = closedCallsQuery.data?.calls || [];
  const totalClosed = closedCallsQuery.data?.total ?? 0;
  const hasMore = Boolean(closedCallsQuery.hasNextPage);

  const overview = overviewQuery.data;
  const closedOverview = closedOverviewQuery.data;
  const totalCalls = overview?.totalCalls ?? 0;
  const resolutionRate =
    totalCalls > 0 ? Math.round(((overview?.closedCalls ?? 0) / totalCalls) * 100) : 0;
  const slaRate = overview?.withinDeadlineRate ?? 0;
  const withinDeadlineCount = overview?.withinDeadlineCount ?? 0;
  const overdueCount = overview?.overdueCount ?? 0;
  const statusBreakdown = closedOverview?.statusBreakdown || overview?.statusBreakdown || [];

  // Comparativo com a média da cidade
  const citySlaRate = cityOverviewQuery.data?.withinDeadlineRate ?? null;
  const slaDiff =
    neighborhood && citySlaRate !== null
      ? slaRate - citySlaRate
      : null;

  // Filtragem dos chamados de acordo com o SLA selecionado
  const filteredCalls = useMemo(() => {
    if (slaFilter === 'all') return closedCalls;
    return closedCalls.filter((call) => {
      const deadline = resolveOfficialCallDeadline(call, true);
      if (slaFilter === 'on_time') {
        return deadline ? !deadline.isOverdue : true;
      }
      return deadline ? deadline.isOverdue : false;
    });
  }, [closedCalls, slaFilter]);

  const slaTabOptions = [
    { value: 'all', label: `Todos (${totalClosed.toLocaleString('pt-BR')})` },
    {
      value: 'on_time',
      label: `No prazo (${withinDeadlineCount > 0 ? withinDeadlineCount.toLocaleString('pt-BR') : '—'})`,
    },
    {
      value: 'overdue',
      label: `Com atraso (${overdueCount > 0 ? overdueCount.toLocaleString('pt-BR') : '—'})`,
    },
  ];

  return (
    <AppScreen>
      <AppHeader
        title="Resultados e Prazos · 1746"
        context="Carta de Serviços e SLA da Prefeitura do Rio"
        onBack={() => goBack()}
      />

      <FlatList
        data={filteredCalls}
        keyExtractor={(call) => call.id}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        contentContainerStyle={cityStyles.content}
        renderItem={({ item: call }) => (
          <OfficialCallRow
            call={call}
            onPress={() =>
              router.push({
                pathname: '/OfficialCallDetailsScreen',
                params: { id: call.id },
              })
            }
          />
        )}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* Cápsula Territorial Inteligente */}
            <View
              style={[
                styles.territoryCapsule,
                { backgroundColor: colors.surface, borderColor: colors.divider },
              ]}
            >
              <View style={styles.territoryInfo}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                <View style={styles.territoryTextCol}>
                  <AppText variant="caption" color="muted">
                    Recorte territorial
                  </AppText>
                  <AppText variant="label" numberOfLines={1} style={styles.territoryName}>
                    {neighborhood || 'Todo o Rio de Janeiro'}
                  </AppText>
                </View>
              </View>

              <View style={styles.territoryActions}>
                <NeighborhoodPicker
                  compact
                  options={bairroOptions}
                  value={neighborhood}
                  onChange={(val) => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setNeighborhood(val);
                  }}
                />
                {Boolean(neighborhood) && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Ver todo o município"
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNeighborhood('');
                    }}
                    style={({ pressed }) => [
                      styles.clearBairroBtn,
                      { backgroundColor: colors.surfaceSubdued },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons name="close" size={15} color={colors.muted} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Painel de Indicadores de SLA (3 KPIs Cívicos - Apple HIG) */}
            {overview && totalCalls > 0 && (
              <View style={styles.dashboardBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="speedometer-outline" size={13} color={colors.muted} />
                  <AppText variant="caption" style={styles.sectionHeaderText}>
                    INDICADORES OFICIAIS DE DESEMPENHO (SLA)
                  </AppText>
                </View>

                {/* KPI Principal Hero: Cumprimento de Prazo */}
                <View
                  style={[
                    styles.heroKpiCard,
                    { backgroundColor: colors.surface, borderColor: colors.divider },
                  ]}
                >
                  <View style={styles.heroKpiTopRow}>
                    <View
                      style={[
                        styles.kpiIconSquircle,
                        { backgroundColor: colors.primaryContainer },
                      ]}
                    >
                      <Ionicons name="timer-outline" size={20} color={colors.primary} />
                    </View>

                    <View style={styles.heroKpiTitleCol}>
                      <AppText variant="caption" color="muted">
                        Cumprimento de prazo (SLA)
                      </AppText>
                      <AppText variant="label">Prazos oficiais respeitados</AppText>
                    </View>

                    {/* Pílula de Comparativo com a Cidade */}
                    {slaDiff !== null && (
                      <View
                        style={[
                          styles.benchmarkPill,
                          {
                            backgroundColor:
                              slaDiff >= 0
                                ? isDark
                                  ? 'rgba(46, 125, 50, 0.2)'
                                  : '#E8F5E9'
                                : isDark
                                  ? 'rgba(198, 40, 40, 0.2)'
                                  : '#FFEBEE',
                          },
                        ]}
                      >
                        <Ionicons
                          name={slaDiff >= 0 ? 'trending-up' : 'trending-down'}
                          size={13}
                          color={slaDiff >= 0 ? colors.completed : colors.risk}
                        />
                        <AppText
                          variant="caption"
                          style={{
                            fontWeight: '700',
                            fontSize: 11,
                            color: slaDiff >= 0 ? colors.completed : colors.risk,
                          }}
                        >
                          {slaDiff >= 0 ? `+${slaDiff}%` : `${slaDiff}%`} vs média do Rio
                        </AppText>
                      </View>
                    )}
                  </View>

                  <View style={styles.heroKpiValueRow}>
                    <AppText
                      style={[
                        styles.heroKpiNumber,
                        {
                          color:
                            slaRate >= 80
                              ? colors.completed
                              : slaRate >= 60
                                ? colors.attention
                                : colors.risk,
                        },
                      ]}
                    >
                      {slaRate}%
                    </AppText>
                    <View style={styles.heroKpiDetailCol}>
                      <AppText variant="label" style={{ fontWeight: '700' }}>
                        {withinDeadlineCount.toLocaleString('pt-BR')} no prazo
                      </AppText>
                      <AppText variant="caption" color="muted">
                        {overdueCount.toLocaleString('pt-BR')} chamados com prazo estourado
                      </AppText>
                    </View>
                  </View>

                  {/* Barra Visual de Cumprimento de SLA */}
                  <View style={[styles.barTrack, { backgroundColor: colors.surfaceSubdued }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.min(100, Math.max(0, slaRate))}%`,
                          backgroundColor:
                            slaRate >= 80
                              ? colors.completed
                              : slaRate >= 60
                                ? colors.attention
                                : colors.risk,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Dupla de KPIs Secundários: Conclusão & Total */}
                <View style={styles.secondaryKpiRow}>
                  {/* KPI 2: Taxa de Conclusão */}
                  <View
                    style={[
                      styles.secondaryKpiCard,
                      { backgroundColor: colors.surface, borderColor: colors.divider },
                    ]}
                  >
                    <View style={styles.secondaryKpiHeader}>
                      <View
                        style={[
                          styles.kpiSmallIcon,
                          { backgroundColor: colors.surfaceSubdued },
                        ]}
                      >
                        <Ionicons
                          name="checkmark-done-circle-outline"
                          size={16}
                          color={colors.completed}
                        />
                      </View>
                      <AppText variant="caption" color="muted">
                        Taxa de conclusão
                      </AppText>
                    </View>

                    <AppText
                      style={[styles.secondaryKpiNumber, { color: colors.completed }]}
                    >
                      {resolutionRate}%
                    </AppText>

                    <AppText variant="caption" color="muted" numberOfLines={1}>
                      {(overview.closedCalls ?? 0).toLocaleString('pt-BR')} de{' '}
                      {totalCalls.toLocaleString('pt-BR')}
                    </AppText>
                  </View>

                  {/* KPI 3: Total Registrado */}
                  <View
                    style={[
                      styles.secondaryKpiCard,
                      { backgroundColor: colors.surface, borderColor: colors.divider },
                    ]}
                  >
                    <View style={styles.secondaryKpiHeader}>
                      <View
                        style={[
                          styles.kpiSmallIcon,
                          { backgroundColor: colors.surfaceSubdued },
                        ]}
                      >
                        <Ionicons
                          name="documents-outline"
                          size={16}
                          color={colors.primary}
                        />
                      </View>
                      <AppText variant="caption" color="muted">
                        Total registrado
                      </AppText>
                    </View>

                    <AppText style={[styles.secondaryKpiNumber, { color: colors.ink }]}>
                      {totalCalls.toLocaleString('pt-BR')}
                    </AppText>

                    <AppText variant="caption" color="muted" numberOfLines={1}>
                      Demandas no DATA.RIO
                    </AppText>
                  </View>
                </View>

                {/* Termômetro de Desfechos Operacionais */}
                {statusBreakdown.length > 0 && (
                  <View style={styles.breakdownBlock}>
                    <View style={styles.sectionHeaderRow}>
                      <Ionicons name="pie-chart-outline" size={13} color={colors.muted} />
                      <AppText variant="caption" style={styles.sectionHeaderText}>
                        DESFECHO OPERACIONAL (STATUS OFICIAL 1746)
                      </AppText>
                    </View>

                    <View
                      style={[
                        styles.breakdownTable,
                        { backgroundColor: colors.surface, borderColor: colors.divider },
                      ]}
                    >
                      {statusBreakdown.slice(0, 6).map((item, idx) => {
                        const base =
                          closedOverview?.totalCalls || overview.totalCalls || 1;
                        const { label: pctLabel, barWidth } = breakdownShare(
                          item.count,
                          base,
                        );
                        const statusColor = getStatusSemanticColor(item.status, colors);

                        return (
                          <View key={item.status}>
                            {idx > 0 && (
                              <View
                                style={[
                                  styles.tableDivider,
                                  { backgroundColor: colors.divider },
                                ]}
                              />
                            )}
                            <View style={styles.breakdownItemRow}>
                              <View style={styles.breakdownLabelRow}>
                                <View style={styles.breakdownStatusLeft}>
                                  <View
                                    style={[
                                      styles.statusDot,
                                      { backgroundColor: statusColor },
                                    ]}
                                  />
                                  <AppText
                                    variant="label"
                                    numberOfLines={1}
                                    style={styles.statusLabelText}
                                  >
                                    {item.status}
                                  </AppText>
                                </View>
                                <AppText variant="caption" color="muted">
                                  {item.count.toLocaleString('pt-BR')} ({pctLabel}%)
                                </AppText>
                              </View>

                              <View
                                style={[
                                  styles.barTrack,
                                  { backgroundColor: colors.surfaceSubdued },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.barFill,
                                    {
                                      width: `${barWidth}%`,
                                      backgroundColor: statusColor,
                                    },
                                  ]}
                                />
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Seção da Lista de Chamados com Filtro Segmentado de SLA */}
            <View style={styles.listSectionHeader}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="list-outline" size={13} color={colors.muted} />
                <AppText variant="caption" style={styles.sectionHeaderText}>
                  HISTÓRICO DE ATENDIMENTOS ENCERRADOS
                </AppText>
              </View>

              {/* Filtro Segmentado por Cumprimento de Prazo */}
              <SlidingTabs
                options={slaTabOptions}
                value={slaFilter}
                label="Filtrar por cumprimento de prazo"
                onChange={(val) => {
                  if (val === 'all' || val === 'on_time' || val === 'overdue') {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSlaFilter(val);
                  }
                }}
              />
            </View>

            <QueryState
              loading={closedCallsQuery.isPending}
              error={closedCallsQuery.error}
              retry={() => {
                void closedCallsQuery.refetch();
                void overviewQuery.refetch();
                void closedOverviewQuery.refetch();
                void cityOverviewQuery.refetch();
              }}
            />

            {!closedCallsQuery.isPending &&
              !closedCallsQuery.error &&
              filteredCalls.length === 0 && (
                <IllustratedEmptyState
                  kind="target"
                  title="Nenhum chamado neste recorte"
                  description={
                    slaFilter === 'overdue'
                      ? 'Nenhum chamado encerrado com atraso sincronizado para este filtro.'
                      : slaFilter === 'on_time'
                        ? 'Nenhum chamado encerrado dentro do prazo sincronizado neste recorte.'
                        : neighborhood
                          ? 'Não há chamados encerrados sincronizados para este bairro no momento.'
                          : 'Chamados encerrados pela prefeitura aparecerão aqui.'
                  }
                  action={
                    slaFilter !== 'all'
                      ? {
                          title: 'Ver todos os chamados',
                          onPress: () => {
                            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSlaFilter('all');
                          },
                        }
                      : neighborhood
                        ? {
                            title: 'Ver todo o município',
                            onPress: () => {
                              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setNeighborhood('');
                            },
                          }
                        : undefined
                  }
                />
              )}
          </View>
        }
        ListFooterComponent={
          <View style={styles.footerContainer}>
            {hasMore && (
              <AppButton
                title={
                  closedCallsQuery.isFetchingNextPage
                    ? 'Carregando mais atendimentos...'
                    : `Carregar mais (${filteredCalls.length} de ${totalClosed.toLocaleString('pt-BR')})`
                }
                disabled={closedCallsQuery.isFetchingNextPage}
                variant="secondary"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  void closedCallsQuery.fetchNextPage();
                }}
              />
            )}

            {/* Card de Transparência e Marco Regulatório (Apple Inset Table) */}
            <View style={styles.transparencyBlock}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={13}
                  color={colors.muted}
                />
                <AppText variant="caption" style={styles.sectionHeaderText}>
                  TRANSPARÊNCIA CÍVICA E FONTES OFICIAIS
                </AppText>
              </View>

              <View
                style={[
                  styles.transparencyTable,
                  { backgroundColor: colors.surface, borderColor: colors.divider },
                ]}
              >
                <View style={styles.transparencyRow}>
                  <View
                    style={[
                      styles.kpiSmallIcon,
                      { backgroundColor: colors.primaryContainer },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={17}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.transparencyTextCol}>
                    <AppText variant="label">Marco Regulatório do 1746</AppText>
                    <AppText variant="caption" color="muted">
                      Os prazos de atendimento seguem o Decreto Rio nº 44.850 e a Carta
                      de Serviços aos Cidadãos da Prefeitura do Rio.
                    </AppText>
                  </View>
                </View>

                <View
                  style={[styles.tableDivider, { backgroundColor: colors.divider }]}
                />

                <View style={styles.transparencyRow}>
                  <View
                    style={[
                      styles.kpiSmallIcon,
                      { backgroundColor: colors.primaryContainer },
                    ]}
                  >
                    <Ionicons name="server-outline" size={17} color={colors.primary} />
                  </View>
                  <View style={styles.transparencyTextCol}>
                    <AppText variant="label">Base de Dados Abertos</AppText>
                    <AppText variant="caption" color="muted">
                      Consolidação oficial via DATA.RIO e Escritório de Dados da PCRJ. O
                      Fiscaliza aí não altera prazos nem emite atestados.
                    </AppText>
                  </View>
                </View>
              </View>
            </View>
          </View>
        }
      />
    </AppScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    headerContainer: {
      gap: spacing.lg,
      paddingBottom: spacing.sm,
    },
    territoryCapsule: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: layout.radius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    territoryInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingLeft: 4,
    },
    territoryTextCol: {
      flex: 1,
      gap: 1,
    },
    territoryName: {
      fontSize: 15,
      fontWeight: '800',
    },
    territoryActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    clearBairroBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dashboardBlock: {
      gap: 8,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 4,
    },
    sectionHeaderText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    heroKpiCard: {
      borderRadius: layout.radius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.md,
      gap: 12,
    },
    heroKpiTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    kpiIconSquircle: {
      width: 38,
      height: 38,
      borderRadius: layout.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroKpiTitleCol: {
      flex: 1,
      gap: 1,
    },
    benchmarkPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: layout.radius.pill,
    },
    heroKpiValueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 12,
    },
    heroKpiNumber: {
      fontSize: 34,
      fontWeight: '900',
      lineHeight: 38,
    },
    heroKpiDetailCol: {
      flex: 1,
      gap: 2,
    },
    secondaryKpiRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    secondaryKpiCard: {
      flex: 1,
      borderRadius: layout.radius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.md,
      gap: 6,
    },
    secondaryKpiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    kpiSmallIcon: {
      width: 32,
      height: 32,
      borderRadius: layout.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryKpiNumber: {
      fontSize: 22,
      fontWeight: '800',
      lineHeight: 26,
    },
    breakdownBlock: {
      gap: 8,
      marginTop: 4,
    },
    breakdownTable: {
      borderRadius: layout.radius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    breakdownItemRow: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      gap: 6,
    },
    breakdownLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    breakdownStatusLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      paddingRight: 8,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusLabelText: {
      fontSize: 13,
      fontWeight: '700',
    },
    barTrack: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 3,
    },
    listSectionHeader: {
      gap: 10,
      marginTop: 6,
    },
    tableDivider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: 14,
    },
    footerContainer: {
      paddingTop: spacing.md,
      paddingBottom: 40,
      gap: spacing.lg,
    },
    transparencyBlock: {
      gap: 8,
    },
    transparencyTable: {
      borderRadius: layout.radius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    transparencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    transparencyTextCol: {
      flex: 1,
      gap: 2,
    },
  });
