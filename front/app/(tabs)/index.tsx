import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router, useIsFocused } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppSelect } from '@/components/ui/AppSelect';
import { AppInput } from '@/components/ui/AppInput';
import { QueryState } from '@/features/city/CityUI';
import {
  useOfficialCalls,
  useOfficialFilters,
  useSyncStatus,
} from '@/features/city/useOfficialCalls';
import { useFollowStore } from '@/stores/followStore';
import { useTerritoryStore } from '@/stores/territoryStore';
import { useTerritoryFilters } from '@/features/places/useTerritoryFilters';
import { PlaceSelector } from '@/features/places/PlaceSelector';
import { NearbyCalls } from '@/features/home/NearbyCalls';
import { CategoryChips } from '@/features/home/CategoryChips';
import {
  TERRITORY_PERIOD_OPTIONS,
  TERRITORY_STATUS_OPTIONS,
} from '@/features/territory/selectors';
import { CitizenAction } from '@/features/city/CitizenAction';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { spacing, useTheme } from '@/theme';

export default function HomeScreen() {
  const active = useIsFocused();
  const { colors, isDark } = useTheme();
  const filters = useTerritoryFilters();
  const search = useDebouncedValue(filters.search, 300);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasExtraFilters = Boolean(
    filters.search.trim() ||
      filters.status !== 'all' ||
      filters.period !== 'all',
  );
  const showFilterDrawer = filtersOpen || hasExtraFilters;

  const calls = useOfficialCalls(
    {
      ...filters.params,
      search: search.trim() || undefined,
      limit: 5,
    },
    active && filters.hydrated,
    filters.cacheScope,
  );

  const options = useOfficialFilters(active);
  const sync = useSyncStatus(active);
  const saved = useFollowStore((s) => s.savedCalls);
  const savedReady = useFollowStore((s) => s.hydrated);

  const explore = (list = false) => {
    useTerritoryStore.getState().setIsListView(list);
    useTerritoryStore.getState().setLayers(['official']);
    router.push({
      pathname: '/(tabs)/TerritoryScreen',
      params: { fromHome: String(Date.now()) },
    });
  };

  const sectionHeading =
    filters.selection.kind === 'radius' ||
    filters.selection.kind === 'pending-current'
      ? 'Chamados próximos'
      : filters.selection.kind === 'neighborhood'
      ? `Chamados em ${filters.selection.name}`
      : 'Chamados recentes';

  const callsList = calls.data?.calls || [];

  return (
    <AppScreen>
      <AppHeader title="Fiscaliza aí" context="Rio de Janeiro · RJ" />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.contentPadding,
          paddingBottom: 120,
          gap: spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={calls.isRefetching}
            tintColor={colors.ink}
            onRefresh={() => {
              if (filters.hydrated) {
                void calls.refetch();
                void sync.refetch();
              }
            }}
          />
        }
      >
        {/* 1. Contexto Territorial + Ações de Exploração */}
        <View style={styles.topTerritoryGroup}>
          <PlaceSelector prompt />

          <View style={styles.quickExploreRow}>
            <View style={styles.quickExploreBtn}>
              <AppButton
                title="Explorar no mapa"
                icon={
                  <Ionicons
                    name="map-outline"
                    size={18}
                    color={colors.onAccent}
                  />
                }
                onPress={() => explore(false)}
              />
            </View>
            <View style={styles.quickExploreBtn}>
              <AppButton
                title="Ver lista"
                variant="secondary"
                icon={
                  <Ionicons name="list-outline" size={18} color={colors.ink} />
                }
                onPress={() => explore(true)}
              />
            </View>
          </View>
        </View>

        {/* 2. Chamados Recentes no Entorno */}
        <View style={styles.feedSection}>
          <View style={styles.feedHeaderRow}>
            <AppText variant="sectionTitle" style={styles.feedTitle}>
              {sectionHeading}
            </AppText>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: showFilterDrawer }}
              accessibilityLabel={
                showFilterDrawer
                  ? 'Ocultar busca e filtros'
                  : 'Buscar ou filtrar chamados'
              }
              onPress={() => setFiltersOpen((prev) => !prev)}
              style={({ pressed }) => [
                styles.filterTogglePill,
                {
                  backgroundColor: showFilterDrawer
                    ? colors.ink
                    : isDark
                    ? colors.surfaceSubdued
                    : colors.surface,
                  borderColor: showFilterDrawer ? colors.ink : colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Ionicons
                name="options-outline"
                size={15}
                color={showFilterDrawer ? colors.canvas : colors.ink}
              />
              <AppText
                variant="caption"
                style={{
                  fontWeight: '600',
                  color: showFilterDrawer ? colors.canvas : colors.ink,
                }}
              >
                {showFilterDrawer ? 'Fechar busca' : 'Buscar / Filtrar'}
              </AppText>
            </Pressable>
          </View>

          <CategoryChips
            value={filters.serviceType}
            onChange={(type) => filters.setFilter('serviceType', type)}
            dynamicTypes={options.data?.tipos}
          />

          {showFilterDrawer && (
            <View style={styles.filterDrawer}>
              <AppInput
                label="Buscar chamados"
                placeholder="Buscar por serviço, rua ou protocolo..."
                value={filters.search}
                onChangeText={(value) => filters.setFilter('search', value)}
              />
              <View style={styles.secondaryFiltersRow}>
                <AppSelect
                  compact
                  defaultValue="all"
                  label="Situação"
                  value={filters.status}
                  options={TERRITORY_STATUS_OPTIONS}
                  onChange={(v) => filters.setFilter('status', v)}
                />
                <AppSelect
                  compact
                  defaultValue="all"
                  label="Período"
                  value={filters.period}
                  options={TERRITORY_PERIOD_OPTIONS}
                  onChange={(v) => filters.setFilter('period', v)}
                />
              </View>
            </View>
          )}

          <QueryState
            loading={calls.isLoading}
            error={calls.error}
            retry={calls.refetch}
          />

          {filters.selection.kind === 'pending-current' && (
            <View style={styles.statusBox}>
              <Ionicons name="location-outline" size={18} color={colors.muted} />
              <AppText variant="caption" color="muted" style={{ flex: 1 }}>
                Aguardando localização para consultar o entorno. Toque no seletor acima para ativar o GPS.
              </AppText>
            </View>
          )}

          {calls.fetchStatus === 'paused' && (
            <View style={styles.statusBox}>
              <Ionicons name="cloud-offline-outline" size={18} color={colors.risk} />
              <AppText variant="caption" color="risk" style={{ flex: 1 }}>
                Sem conexão no momento. As informações serão atualizadas assim que a rede voltar.
              </AppText>
            </View>
          )}

          {calls.data && calls.data.calls.length === 0 && (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: isDark ? colors.surfaceSubdued : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="checkmark-done-circle-outline"
                size={36}
                color={colors.ink}
                style={{ marginBottom: 2 }}
              />
              <AppText variant="sectionTitle" style={styles.emptyTitle}>
                Nenhum chamado neste recorte
              </AppText>
              <AppText variant="caption" color="muted" style={styles.emptySubtitle}>
                Não encontramos registros com os filtros atuais. Você pode ampliar o raio acima, trocar a categoria ou abrir o mapa completo.
              </AppText>
            </View>
          )}

          <NearbyCalls
            calls={callsList}
            selection={filters.selection}
          />

          <View style={styles.transparencyFooter}>
            <Ionicons name="information-circle-outline" size={14} color={colors.muted} />
            <AppText variant="meta" color="muted" style={styles.transparencyText}>
              Dados públicos oficiais da Central 1746 (Prefeitura do Rio).
              {sync.data?.lastSyncAt
                ? ` Atualizado em ${new Date(sync.data.lastSyncAt).toLocaleDateString('pt-BR')}.`
                : ''}
            </AppText>
          </View>
        </View>

        {/* 3. Chamados Salvos / Acompanhados */}
        {savedReady && saved.length > 0 && (
          <View style={styles.savedSection}>
            <View style={styles.feedHeaderRow}>
              <AppText variant="sectionTitle" style={styles.feedTitle}>
                Salvos por você
              </AppText>
              <AppText variant="caption" color="muted">
                {saved.length} {saved.length === 1 ? 'salvo' : 'salvos'}
              </AppText>
            </View>

            <NearbyCalls
              calls={saved.slice(0, 2)}
              selection={{ kind: 'municipality' }}
            />

            <AppButton
              title="Ver todos os salvos"
              variant="secondary"
              onPress={() => router.push('/(tabs)/FollowScreen')}
            />
          </View>
        )}

        {/* 4. Ação Cidadã - 1746 */}
        <CitizenAction
          title="Precisa abrir um protocolo no 1746?"
          description="Veja como registrar uma demanda e acesse os canais oficiais da prefeitura"
          icon="open-outline"
          onPress={() => router.push('/(tabs)/ParticipateScreen')}
        />
      </ScrollView>
    </AppScreen>
  );
}

const createStyleSheet = StyleSheet?.create || ((s: any) => s);

const styles = createStyleSheet({
  topTerritoryGroup: {
    gap: spacing.xs || 8,
  },
  quickExploreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs || 8,
  },
  quickExploreBtn: {
    flex: 1,
    minWidth: 148,
  },
  feedSection: {
    gap: spacing.sm || 12,
  },
  savedSection: {
    gap: spacing.sm || 12,
  },
  feedTitle: {
    flex: 1,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs || 8,
  },
  filterTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterDrawer: {
    gap: spacing.xs || 8,
  },
  secondaryFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs || 8,
    paddingVertical: 2,
    flexWrap: 'wrap',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs || 8,
    padding: spacing.sm || 12,
    borderRadius: 999,
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.lg || 24,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: spacing.xs || 8,
  },
  emptyTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
  },
  transparencyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: spacing.xs || 8,
    paddingHorizontal: 2,
  },
  transparencyText: {
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
});
