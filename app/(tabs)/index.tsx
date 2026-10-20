import React, { useState } from 'react';
import {
  ScrollView,
  View,
  RefreshControl,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import { CitySearch } from '@/components/ui/CitySearch';
import { AppButton } from '@/components/ui/AppButton';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { QueryState, createCityStyles } from '@/features/city/CityUI';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import {
  useOfficialCalls,
  useOfficialFilters,
  useOfficialOverview,
} from '@/features/city/useOfficialCalls';
import { Rio1746OverviewCard } from '@/components/official/Rio1746OverviewCard';
import { OfficialCallRow } from '@/components/official/OfficialCallRow';
import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';
import { useAuthStore } from '@/stores/authStore';
import { useTerritorySelection } from '@/stores/territoryStore';

export default function HomeScreen() {
  const { colors } = useTheme();
  const cityStyles = useThemedStyles(createCityStyles);
  const styles = useThemedStyles(createStyles);

  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { neighborhood, setNeighborhood } = useTerritorySelection();

  const officialOverview = useOfficialOverview(neighborhood || undefined);
  const officialFilters = useOfficialFilters();
  const recentCalls = useOfficialCalls({
    bairro: neighborhood || undefined,
    limit: 15,
  });

  const bairroOptions = officialFilters.data?.bairros || [];
  const calls = recentCalls.data?.calls || [];
  const totalInSelection = recentCalls.data?.total ?? officialOverview.data?.totalCalls ?? 0;

  const refresh = () => {
    void officialOverview.refetch();
    void officialFilters.refetch();
    void recentCalls.refetch();
  };

  const pullRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        officialOverview.refetch(),
        officialFilters.refetch(),
        recentCalls.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <AppScreen>
      <AppHeader
        title={`Olá, ${user?.name ? user.name.split(' ')[0] : 'Cidadão'}`}
        context="Rio de Janeiro · RJ · Inteligência 1746"
      />
      <ScrollView
        contentContainerStyle={[cityStyles.content, { flexGrow: 1 }]}
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void pullRefresh();
            }}
            tintColor={colors.ink}
            colors={[colors.ink]}
          />
        }
      >
        <CitySearch
          onPress={() => router.push('/(tabs)/TerritoryScreen')}
          onFilters={() =>
            router.push({
              pathname: '/(tabs)/TerritoryScreen',
              params: { filters: String(Date.now()) },
            })
          }
        />

        <View style={cityStyles.section}>
          <AppText variant="screenTitle">
            {neighborhood ? `Bairro: ${neighborhood}` : 'Panorama no Rio de Janeiro'}
          </AppText>
          <NeighborhoodPicker
            options={bairroOptions}
            value={neighborhood}
            onChange={setNeighborhood}
          />
        </View>

        <View style={cityStyles.section}>
          <Rio1746OverviewCard
            overview={officialOverview.data}
            isLoading={officialOverview.isLoading}
          />
        </View>

        {!neighborhood &&
          officialOverview.data?.topNeighborhoods &&
          officialOverview.data.topNeighborhoods.length > 0 && (
            <View style={cityStyles.section}>
              <AppText variant="sectionTitle">
                Bairros com maior volume de chamados
              </AppText>
              <View style={styles.neighborhoodGrid}>
                {officialOverview.data.topNeighborhoods.slice(0, 6).map((item) => (
                  <Pressable
                    key={item.neighborhood}
                    style={({ pressed }) => [
                      styles.neighborhoodChip,
                      pressed && { opacity: 0.75 },
                    ]}
                    onPress={() => setNeighborhood(item.neighborhood)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filtrar por ${item.neighborhood}, ${item.count} chamados`}
                  >
                    <View style={styles.neighborhoodChipHeader}>
                      <Ionicons name="location-outline" size={14} color="#0072BB" />
                      <AppText
                        variant="label"
                        color="ink"
                        numberOfLines={1}
                        style={{ flex: 1 }}
                      >
                        {item.neighborhood}
                      </AppText>
                    </View>
                    <AppText variant="caption" color="muted">
                      {item.count.toLocaleString('pt-BR')} chamados
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

        <QueryState
          loading={recentCalls.isPending}
          error={recentCalls.error || officialOverview.error}
          retry={refresh}
        />

        {!recentCalls.isPending && calls.length === 0 && !recentCalls.error && (
          <View style={cityStyles.section}>
            <IllustratedEmptyState
              kind="territory"
              title="Nenhum chamado 1746 neste recorte"
              description="Não encontramos chamados sincronizados para este filtro no momento."
              action={{
                title: neighborhood ? 'Limpar filtro de bairro' : 'Explorar o mapa',
                onPress: () =>
                  neighborhood
                    ? setNeighborhood('')
                    : router.push('/(tabs)/TerritoryScreen'),
              }}
            />
          </View>
        )}

        {calls.length > 0 && (
          <View style={cityStyles.section}>
            <View style={styles.sectionHeaderRow}>
              <AppText variant="sectionTitle">Chamados recentes (1746)</AppText>
              <AppText variant="caption" color="muted">
                {totalInSelection.toLocaleString('pt-BR')} no total
              </AppText>
            </View>
            <View style={{ gap: spacing.xs }}>
              {calls.map((call) => (
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
            <AppButton
              title="Explorar todos no mapa e lista"
              variant="secondary"
              onPress={() => router.push('/(tabs)/TerritoryScreen')}
            />
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    neighborhoodGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    neighborhoodChip: {
      minWidth: '47%',
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: layout.radius.panel,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.divider,
      gap: 4,
    },
    neighborhoodChipHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  });
}
