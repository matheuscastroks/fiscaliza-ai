import { router } from 'expo-router';
import { InsetGroup, ListRow } from '@/components/ui/ListRow';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import { goBack } from '@/utils/navigation';
import { ScrollView, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { QueryState, createCityStyles } from '@/features/city/CityUI';
import { breakdownShare } from '@/features/city/resultBreakdown';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { useTerritorySelection } from '@/stores/territoryStore';
import { useOfficialFilters, useOfficialOverview } from '@/features/city/useOfficialCalls';
import { formatDays, topByVolume } from '@/features/city/resultRankings';
import { layout } from '@/theme';
import { officialStatusColor } from '@/features/city/officialCallStatus';
import { createStyles } from '@/features/city/resultsScreenStyles';

export default function ResultsScreen() {
  const { colors } = useTheme();
  const cityStyles = useThemedStyles(createCityStyles);
  const styles = useThemedStyles(createStyles);
  const { neighborhood, neighborhoodId, setNeighborhood } = useTerritorySelection();

  const officialFilters = useOfficialFilters();
  const overviewQuery = useOfficialOverview({
    bairro: neighborhood || undefined,
  });
  const closedOverviewQuery = useOfficialOverview({
    bairro: neighborhood || undefined,
    situacao: 'Encerrado',
  });
  // Rankings territoriais sempre comparam o município inteiro.
  const cityOverviewQuery = useOfficialOverview(undefined);

  const bairroOptions = officialFilters.data?.bairros || [];

  const overview = overviewQuery.data;
  const closedOverview = closedOverviewQuery.data;
  const totalCalls = overview?.totalCalls ?? 0;
  const resolutionRate =
    totalCalls > 0 ? Math.round(((overview?.closedCalls ?? 0) / totalCalls) * 100) : 0;
  const slaRate = overview?.withinDeadlineRate ?? 0;
  const withinDeadlineCount = overview?.withinDeadlineCount ?? 0;
  const overdueCount = overview?.overdueCount ?? 0;
  const statusBreakdown = closedOverview?.statusBreakdown || overview?.statusBreakdown || [];

  const ranking = cityOverviewQuery.data?.neighborhoodRanking || [];
  const mostProblems = topByVolume(ranking);
  const topServices = (overview?.topServices || []).slice(0, 6);
  const speedByService = new Map(
    (overview?.serviceSpeed || []).map((s) => [s.type, s.avgResolutionDays]),
  );
  const cityAvgDays = cityOverviewQuery.data?.avgResolutionDays ?? null;
  const avgDays = overview?.avgResolutionDays ?? null;

  const openNeighborhood = (name: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNeighborhood(name);
  };

  return (
    <AppScreen>
      <AppHeader
        title="Dados do bairro"
        context={neighborhood ? `${neighborhood} · chamados do 1746 e prazos publicados` : "Rio de Janeiro · chamados do 1746 e prazos publicados"}
        onBack={() => goBack()}
      />

      <ScrollView
        contentContainerStyle={cityStyles.content}
        showsVerticalScrollIndicator={false}
      >
          {neighborhoodId ? (
            <InsetGroup>
              <ListRow
                icon="business-outline"
                title="Serviços e equipamentos do bairro"
                subtitle="Escolas, saúde e praças, com chamados do período"
                onPress={() =>
                  router.push({ pathname: '/NeighborhoodScreen', params: { neighborhoodId } })
                }
              />
            </InsetGroup>
          ) : null}
          <View style={styles.headerContainer}>
            {/* Cápsula Territorial Inteligente */}
            <View
              style={[
                styles.territoryCapsule,
                { backgroundColor: colors.surface, borderColor: colors.divider },
              ]}
            >
              <View style={styles.territoryInfo}>
                <Ionicons name="location-outline" size={layout.iconSize.md} color={colors.primary} />
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
                    <Ionicons name="close" size={layout.iconSize.sm} color={colors.muted} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Painel de Indicadores de SLA (3 KPIs Cívicos - Apple HIG) */}
            {overview && totalCalls > 0 && (
              <View style={styles.dashboardBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="speedometer-outline" size={layout.iconSize.sm} color={colors.muted} />
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
                      <Ionicons name="timer-outline" size={layout.iconSize.md} color={colors.primary} />
                    </View>

                    <View style={styles.heroKpiTitleCol}>
                      <AppText variant="caption" color="muted">
                        Cumprimento de prazo (SLA)
                      </AppText>
                      <AppText variant="label">Prazos oficiais respeitados</AppText>
                    </View>

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
                      <AppText variant="label" style={{ fontWeight: '600' }}>
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
                          size={layout.iconSize.sm}
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
                          size={layout.iconSize.sm}
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
                      <Ionicons name="pie-chart-outline" size={layout.iconSize.sm} color={colors.muted} />
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
                        const statusColor = officialStatusColor(item.status, colors);

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

            <QueryState
              loading={overviewQuery.isPending || cityOverviewQuery.isPending}
              error={overviewQuery.error || cityOverviewQuery.error}
              retry={() => {
                void overviewQuery.refetch();
                void closedOverviewQuery.refetch();
                void cityOverviewQuery.refetch();
              }}
            />

            {/* Velocidade de resolução */}
            {avgDays != null && (
              <View style={styles.dashboardBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="hourglass-outline" size={layout.iconSize.sm} color={colors.muted} />
                  <AppText variant="caption" style={styles.sectionHeaderText}>
                    Velocidade de resolução
                  </AppText>
                </View>
                <View
                  style={[
                    styles.heroKpiCard,
                    { backgroundColor: colors.surface, borderColor: colors.divider },
                  ]}
                >
                  <View style={styles.heroKpiValueRow}>
                    <AppText style={[styles.heroKpiNumber, { color: colors.ink }]}>
                      {formatDays(avgDays)}
                    </AppText>
                    <View style={styles.heroKpiDetailCol}>
                      <AppText variant="label" style={{ fontWeight: '600' }}>
                        Tempo médio até o encerramento
                      </AppText>
                      {neighborhood && cityAvgDays != null ? (
                        <AppText variant="caption" color="muted">
                          Média do Rio: {formatDays(cityAvgDays)}
                        </AppText>
                      ) : (
                        <AppText variant="caption" color="muted">
                          Entre a abertura e o encerramento publicados
                        </AppText>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Tipos de problema mais frequentes */}
            {topServices.length > 0 && (
              <RankingSection
                icon="construct-outline"
                title={neighborhood ? `Problemas mais registrados · ${neighborhood}` : 'Problemas mais registrados'}
                rows={topServices.map((service) => {
                  const days = speedByService.get(service.type);
                  return {
                    key: service.type,
                    label: service.type,
                    detail: days != null ? `Encerra em média em ${formatDays(days)}` : undefined,
                    value: service.count.toLocaleString('pt-BR'),
                    share: totalCalls > 0 ? service.count / totalCalls : 0,
                    tone: colors.primary,
                  };
                })}
              />
            )}

            {/* Rankings territoriais (município inteiro) */}
            {mostProblems.length > 0 && (
              <RankingSection
                icon="alert-circle-outline"
                title="Bairros com mais chamados registrados"
                rows={mostProblems.map((row) => ({
                  key: row.neighborhood,
                  label: row.neighborhood,
                  detail: row.overdueCount > 0 ? `${row.overdueCount.toLocaleString('pt-BR')} fora do prazo` : undefined,
                  value: row.count.toLocaleString('pt-BR'),
                  share: row.count / (mostProblems[0]?.count || 1),
                  tone: colors.risk,
                  onPress: () => openNeighborhood(row.neighborhood),
                }))}
              />
            )}

            {ranking.length > 0 && (
              <AppText variant="caption" color="muted" style={styles.rankingNote}>
                A lista mostra apenas o volume de chamados registrados, sem avaliar o desempenho de cada bairro. Toque em um bairro para ver seus dados.
              </AppText>
            )}
          </View>

          <View style={styles.footerContainer}>
            {/* Card de Transparência e Marco Regulatório (Apple Inset Table) */}
            <View style={styles.transparencyBlock}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={layout.iconSize.sm}
                  color={colors.muted}
                />
                <AppText variant="caption" style={styles.sectionHeaderText}>
                  Transparência e fontes oficiais
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
                      size={layout.iconSize.sm}
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
                    <Ionicons name="server-outline" size={layout.iconSize.sm} color={colors.primary} />
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
      </ScrollView>
    </AppScreen>
  );
}

interface RankingRow {
  key: string;
  label: string;
  detail?: string;
  value: string;
  /** Fração 0–1 usada apenas para a barra visual. */
  share: number;
  tone: string;
  onPress?: () => void;
}

function RankingSection({
  icon,
  title,
  rows,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  rows: RankingRow[];
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.dashboardBlock}>
      <View style={styles.sectionHeaderRow}>
        <Ionicons name={icon} size={layout.iconSize.sm} color={colors.muted} />
        <AppText variant="caption" style={styles.sectionHeaderText} numberOfLines={1}>
          {title}
        </AppText>
      </View>
      <View
        style={[
          styles.breakdownTable,
          { backgroundColor: colors.surface, borderColor: colors.divider },
        ]}
      >
        {rows.map((row, idx) => (
          <View key={row.key}>
            {idx > 0 && (
              <View style={[styles.tableDivider, { backgroundColor: colors.divider }]} />
            )}
            <Pressable
              disabled={!row.onPress}
              onPress={row.onPress}
              accessibilityRole={row.onPress ? 'button' : undefined}
              accessibilityLabel={`${idx + 1}º ${row.label}: ${row.value}`}
              style={({ pressed }) => [
                styles.rankingRow,
                pressed && { backgroundColor: colors.surfaceSubdued },
              ]}
            >
              <AppText variant="label" style={[styles.rankPosition, { color: row.tone }]}>
                {idx + 1}
              </AppText>
              <View style={styles.rankingContent}>
                <View style={styles.breakdownLabelRow}>
                  <AppText variant="label" numberOfLines={1} style={styles.rankingLabel}>
                    {row.label}
                  </AppText>
                  <AppText variant="label" style={[styles.rankingValue, { color: row.tone }]}>
                    {row.value}
                  </AppText>
                </View>
                {row.detail ? (
                  <AppText variant="caption" color="muted" numberOfLines={1}>
                    {row.detail}
                  </AppText>
                ) : null}
                <View style={[styles.barTrack, { backgroundColor: colors.surfaceSubdued }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(2, Math.min(100, row.share * 100))}%`,
                        backgroundColor: row.tone,
                      },
                    ]}
                  />
                </View>
              </View>
              {row.onPress ? (
                <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.subtle} />
              ) : null}
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
