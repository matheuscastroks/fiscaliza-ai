import React from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
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
  useOfficialOverview,
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
import { layout, spacing, useTheme } from '@/theme';

export default function HomeScreen() {
  const active = useIsFocused();
  const { colors, isDark } = useTheme();
  const filters = useTerritoryFilters();
  const search = useDebouncedValue(filters.search, 300);

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
  const overview = useOfficialOverview(undefined, active && filters.period !== 'all');
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
      ? 'Ocorrências no seu entorno'
      : filters.selection.kind === 'neighborhood'
      ? `Ocorrências em ${filters.selection.name}`
      : 'Ocorrências no Rio de Janeiro';

  const callsList = calls.data?.calls || [];
  const totalCount = callsList.length;

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
        {/* Seletor de Lugar Moderno */}
        <PlaceSelector prompt />

        {/* Hero Card de Descoberta / Mapa */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? colors.surfaceSubdued : colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.heroHeader}>
            <View style={styles.heroText}>
              <View style={styles.badgeRow}>
                <View style={[styles.pulseDot, { backgroundColor: colors.accent || '#0072BB' }]} />
                <AppText variant="meta" style={{ color: colors.accent || '#0072BB', fontWeight: '700' }}>
                  {totalCount > 0 ? `${totalCount} ocorrências recentes` : 'Exploração territorial'}
                </AppText>
              </View>
              <AppText variant="sectionTitle" style={styles.heroTitle}>
                Mapa da sua região
              </AppText>
              <AppText variant="caption" color="muted" style={styles.heroSubtitle}>
                Visualize os pontos georreferenciados no mapa colorido ou veja a listagem detalhada.
              </AppText>
            </View>
          </View>

          <View style={styles.heroActions}>
            <AppButton
              title="Explorar no mapa"
              icon={<Ionicons name="map-outline" size={18} color={colors.canvas} />}
              onPress={() => explore(false)}
            />
            <AppButton
              title="Ver lista"
              variant="secondary"
              icon={<Ionicons name="list-outline" size={18} color={colors.ink} />}
              onPress={() => explore(true)}
            />
          </View>
        </View>

        {/* Bloco de Busca e Filtros Rápidos */}
        <View style={{ gap: spacing.sm }}>
          <View style={styles.feedHeaderCol}>
            <AppText variant="sectionTitle">{sectionHeading}</AppText>
            {totalCount > 0 && (
              <AppText variant="caption" color="muted">
                Exibindo até 5 mais recentes
              </AppText>
            )}
          </View>

          <AppInput
            label="Buscar chamados"
            placeholder="Buscar por serviço, rua ou protocolo..."
            value={filters.search}
            onChangeText={(value) => filters.setFilter('search', value)}
          />

          {/* Chips Visuais de Categoria */}
          <CategoryChips
            value={filters.serviceType}
            onChange={(type) => filters.setFilter('serviceType', type)}
            dynamicTypes={options.data?.tipos}
          />

          {/* Filtros Secundários de Situação e Período */}
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

          {/* Mensagens de Estado e Conexão */}
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

          {/* Empty State Amigável */}
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
                size={40}
                color={colors.ink}
                style={{ marginBottom: 4 }}
              />
              <AppText variant="sectionTitle" style={styles.emptyTitle}>
                Tudo tranquilo por aqui
              </AppText>
              <AppText variant="caption" color="muted" style={styles.emptySubtitle}>
                Nenhum chamado aberto encontrado nesta área com os filtros atuais.
                Você pode ampliar o raio no seletor acima ou explorar outras categorias.
              </AppText>
            </View>
          )}

          {/* Lista de Chamados com Novos Cards */}
          <NearbyCalls
            calls={callsList}
            selection={filters.selection}
          />

          {/* Rodapé sutil de transparência de dados */}
          <View style={styles.transparencyFooter}>
            <Ionicons name="information-circle-outline" size={14} color={colors.muted} />
            <AppText variant="meta" color="muted" style={styles.transparencyText}>
              Dados públicos oficiais integrados à Central 1746 da Prefeitura do Rio.
              {sync.data?.lastSyncAt
                ? ` Sincronizado em ${new Date(sync.data.lastSyncAt).toLocaleDateString('pt-BR')}.`
                : ''}
            </AppText>
          </View>
        </View>

        {/* Chamados Salvos / Acompanhados */}
        {savedReady && saved.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <View style={styles.feedHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="heart" size={18} color={colors.risk} />
                <AppText variant="sectionTitle">Acompanhados por você</AppText>
              </View>
              <AppText variant="caption" color="muted">
                {saved.length} {saved.length === 1 ? 'salvo' : 'salvos'}
              </AppText>
            </View>

            <NearbyCalls
              calls={saved.slice(0, 2)}
              selection={{ kind: 'municipality' }}
            />

            <AppButton
              title="Ver meus salvos"
              variant="secondary"
              onPress={() => router.push('/(tabs)/FollowScreen')}
            />
          </View>
        )}

        {/* Ação Cidadã - 1746 */}
        <CitizenAction
          title="Precisa solicitar um serviço?"
          description="Acesse o canal oficial de atendimento da Prefeitura do Rio"
          icon="open-outline"
          onPress={() => router.push('/(tabs)/ParticipateScreen')}
        />
      </ScrollView>
    </AppScreen>
  );
}

const createStyleSheet = StyleSheet?.create || ((s: any) => s);

const styles = createStyleSheet({
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md || 16,
    gap: spacing.md || 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm || 12,
  },
  heroText: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm || 12,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs || 8,
  },
  feedHeaderCol: {
    gap: 3,
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
    borderRadius: 16,
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
    fontWeight: '700',
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
