import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { layout } from '@/theme/layout';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { CitySearch } from '@/components/ui/CitySearch';
import { OccurrenceRow } from '@/components/occurrences/OccurrenceRow';
import {
  CivicRow,
  QueryState,
  createCityStyles,
  kindLabel,
  statusLabel,
} from '@/features/city/CityUI';
import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { SlidingTabs } from '@/components/ui/SlidingTabs';
import {
  compareTerritoryRecords,
  withinPeriod,
  type TerritoryOrder,
} from '@/shared/territory-order';
import { useCityQuery } from '@/features/city/useCityQuery';
import { inMapRegion } from '@/shared/territory';
import {
  civicLocation,
  civicTerritory,
  matchesNeighborhood,
  neighborhoodOptions,
  normalizeNeighborhood,
  occurrenceMatchesNeighborhood,
} from '@/shared/civic-territory';
import type { CivicItem, Occurrence } from '@/shared/contracts';

import { spacing } from '@/theme/spacing';
import { useAuthStore } from '@/stores/authStore';
import { useTerritorySelection } from '@/stores/territoryStore';
import { municipalityRegion } from '@/features/city/municipalContext';
import { OsmMapView, type MapMarker } from '@/components/ui/OsmMapView';

type Kind = 'all' | 'occurrences' | CivicItem['kind'];
type Entry =
  | { type: 'occurrence'; item: Occurrence }
  | { type: 'civic'; item: CivicItem };
const occurrenceStatus: Record<string, string> = {
  pending: 'Recebida',
  in_progress: 'Em atendimento',
  resolved: 'Concluída',
};
const locatedOccurrence = (item: Occurrence) =>
  Number.isFinite(item.location.latitude) &&
  Number.isFinite(item.location.longitude) &&
  Math.abs(item.location.latitude) <= 90 &&
  Math.abs(item.location.longitude) <= 180
    ? item.location
    : undefined;
const entryLocation = (entry: Entry) =>
  entry.type === 'occurrence'
    ? locatedOccurrence(entry.item)
    : civicLocation(entry.item);

export default function TerritoryScreen() {
  const user = useAuthStore((state) => state.user);
  return <TerritoryContent key={user?.id + ':' + user?.municipality?.id} />;
}

function TerritoryContent() {
  const { colors, mode } = useTheme();
  const pinColors = {
    proposal: colors.attention,
    consultation: colors.muted,
    action: colors.completed,
  };
  const cityStyles = useThemedStyles(createCityStyles);
  const styles = useThemedStyles(createStyles);

  const [order, setOrder] = useState<TerritoryOrder>('date');
  const [period, setPeriod] = useState(0);
  const user = useAuthStore((state) => state.user);
  const municipality = user?.municipality;
  const initial = useMemo(
    () => municipalityRegion(municipality),
    [municipality],
  );
  const occurrences = useCityQuery<Occurrence[]>('/occurrences');
  const civic = useCityQuery<CivicItem[]>('/civic-items');
  const { neighborhood, setNeighborhood } = useTerritorySelection();
  const options = neighborhoodOptions(
    occurrences.data || [],
    civic.data || [],
    user?.neighborhood,
  );
  const [region, setRegion] = useState(initial);
  const [areaOnly, setAreaOnly] = useState(false);
  const [kind, setKind] = useState<Kind>('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [map, setMap] = useState(true);
  const { filters } = useLocalSearchParams<{ filters?: string }>();
  const [filterVisibility, setFilterVisibility] = useState<{
    param?: string;
    open: boolean;
  }>({ open: false });
  const filtersOpen =
    filterVisibility.param === filters
      ? filterVisibility.open
      : Boolean(filters);
  const setFiltersOpen = (open: boolean) =>
    setFilterVisibility({ param: filters, open });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showUnlocated, setShowUnlocated] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const entries = useMemo(() => {
    const term = normalizeNeighborhood(search);
    const result: Entry[] = [];
    if (kind === 'all' || kind === 'occurrences') {
      for (const item of occurrences.data || []) {
        if (
          occurrenceMatchesNeighborhood(item, neighborhood) &&
          (status === 'all' || item.status === status) &&
          normalizeNeighborhood(
            [
              item.title,
              item.description,
              item.location.address,
              item.location.neighborhood,
            ].join(' '),
          ).includes(term)
        )
          result.push({ type: 'occurrence', item });
      }
    }
    if (kind !== 'occurrences') {
      for (const item of civic.data || []) {
        const territory = civicTerritory(item);
        const label =
          territory.scope === 'municipality'
            ? 'Todo o município'
            : territory.neighborhood;
        if (
          (kind === 'all' || item.kind === kind) &&
          matchesNeighborhood(item, neighborhood) &&
          (status === 'all' || item.status === status) &&
          normalizeNeighborhood(
            [
              item.title,
              item.summary,
              label,
              territory.scope === 'location' ? territory.location.address : '',
            ].join(' '),
          ).includes(term)
        )
          result.push({ type: 'civic', item });
      }
    }
    return result
      .filter((entry) => withinPeriod(entry.item, period))
      .sort((a, b) => compareTerritoryRecords(a.item, b.item, order));
  }, [
    occurrences.data,
    civic.data,
    kind,
    status,
    search,
    neighborhood,
    period,
    order,
  ]);
  const unlocated = entries.filter((entry) => !entryLocation(entry));
  const located = entries.filter((entry) => {
    const point = entryLocation(entry);
    return point && (!areaOnly || inMapRegion(point, region));
  });
  const listed = areaOnly ? located : entries;
  const selectedEntry = located.find((entry) => entry.item.id === selectedId);
  const filterCount =
    Number(Boolean(neighborhood)) +
    Number(status !== 'all') +
    Number(areaOnly) +
    Number(period !== 0) +
    Number(order !== 'date');
  const statuses: [string, string][] =
    kind === 'occurrences'
      ? Object.entries(occurrenceStatus)
      : kind === 'proposal'
        ? ['submitted', 'under_review', 'accepted', 'declined'].map((key) => [
            key,
            statusLabel[key],
          ])
        : kind === 'consultation'
          ? ['open', 'closed'].map((key) => [key, statusLabel[key]])
          : kind === 'action'
            ? ['planned', 'in_progress', 'completed'].map((key) => [
                key,
                statusLabel[key],
              ])
            : [];
  const showOccurrences = kind === 'all' || kind === 'occurrences';
  const showCivic = kind !== 'occurrences';
  const dataReady =
    (!showOccurrences || occurrences.data !== undefined) &&
    (!showCivic || civic.data !== undefined);
  const openEntry = (entry: Entry) =>
    router.push({
      pathname:
        entry.type === 'occurrence'
          ? '/ProblemDetailsScreen'
          : '/CivicDetailsScreen',
      params: { id: entry.item.id },
    });
  const renderEntry = (entry: Entry) => (
    <View key={entry.type + entry.item.id}>
      {entry.type === 'occurrence' ? (
        <OccurrenceRow problem={entry.item} onPress={() => openEntry(entry)} />
      ) : (
        <>
          {civicTerritory(entry.item).scope === 'municipality' && (
            <AppText variant="caption" color="accent">
              Abrangência: todo o município
            </AppText>
          )}
          <CivicRow item={entry.item} />
        </>
      )}
    </View>
  );
  const osmMarkers: MapMarker[] = located.flatMap((entry) => {
    const point = entryLocation(entry);
    if (!point) return [];
    return [
      {
        id: entry.item.id,
        latitude: point.latitude,
        longitude: point.longitude,
        title: `${entry.type === 'occurrence' ? 'Ocorrência' : kindLabel[entry.item.kind]} · ${entry.item.title}`,
        description:
          entry.type === 'occurrence'
            ? `${occurrenceStatus[entry.item.status]} · ${entry.item.location.address}`
            : `${statusLabel[entry.item.status]} · ${entry.item.neighborhood}`,
        color:
          entry.type === 'occurrence'
            ? colors.accent
            : pinColors[entry.item.kind],
      },
    ];
  });
  const resetFilters = () => {
    setOrder('date');
    setPeriod(0);
    setSearch('');
    setKind('all');
    setSelectedId(null);
    setStatus('all');
    setNeighborhood('');
    setAreaOnly(false);
  };
  const locate = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationMessage(
          'Localização não autorizada. Explore os bairros pelo mapa ou pela lista.',
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setRegion((current) => ({
        ...current,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));
      setLocationMessage('');
    } catch {
      setLocationMessage(
        'Não foi possível obter sua posição. Tente novamente ou volte ao município.',
      );
    } finally {
      setLocating(false);
    }
  };

  return (
    <AppScreen>
      <AppHeader
        title="Território"
        context={
          municipality
            ? `${municipality.name} · ${municipality.state}`
            : 'Seu município'
        }
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={cityStyles.content}
      >
        <View style={{ gap: spacing.sm }}>
          <CitySearch
            value={search}
            onChangeText={setSearch}
            onFilters={() => setFiltersOpen(!filtersOpen)}
            expanded={filtersOpen}
            filterCount={filterCount}
          />
          <SlidingTabs
            label="Tipos de participação no território"
            options={[
              { value: 'all', label: 'Tudo' },
              { value: 'occurrences', label: 'Ocorrências' },
              { value: 'proposal', label: 'Propostas' },
              { value: 'consultation', label: 'Consultas' },
              { value: 'action', label: 'Ações' },
            ]}
            value={kind}
            onChange={(value) => {
              setKind(value as Kind);
              setStatus('all');
              setSelectedId(null);
              setAreaOnly(false);
            }}
          />
        </View>
        <View style={styles.toolbar}>
          <View style={styles.flex}>
            <AppText variant="label">
              {neighborhood || 'Todo o município'}
            </AppText>
            {dataReady && (
              <AppText
                variant="meta"
                color="muted"
                accessibilityLiveRegion="polite"
              >
                {listed.length}{' '}
                {listed.length === 1 ? 'resultado' : 'resultados'}
                {areaOnly ? ' na área visível' : ''}
              </AppText>
            )}
          </View>
        </View>
        {filtersOpen && (
          <View style={styles.filters}>
            <AppText variant="label">Bairro</AppText>
            <NeighborhoodPicker
              options={options}
              value={neighborhood}
              onChange={(value) => {
                setNeighborhood(value);
                setAreaOnly(false);
                setSelectedId(null);
              }}
            />
            {statuses.length > 0 && (
              <>
                <AppText variant="label">Situação</AppText>
                <SlidingTabs
                  label="Filtrar por situação"
                  options={[['all', 'Todas'], ...statuses].map(
                    ([value, label]) => ({ value, label }),
                  )}
                  value={status}
                  onChange={setStatus}
                />
              </>
            )}
            <AppText variant="label">Período</AppText>
            <SlidingTabs
              label="Filtrar por período"
              edgeToEdge={false}
              options={[
                { value: '0', label: 'Todo o período' },
                { value: '1', label: 'Últimas 24h' },
                { value: '7', label: 'Últimos 7 dias' },
                { value: '30', label: 'Últimos 30 dias' },
              ]}
              value={String(period)}
              onChange={(value) => {
                setPeriod(Number(value));
                setSelectedId(null);
              }}
            />
            <AppText variant="label">Ordenar por</AppText>
            <SlidingTabs
              label="Ordenar território"
              edgeToEdge={false}
              options={[
                { value: 'date', label: 'Mais recentes' },
                { value: 'supports', label: 'Mais apoiados' },
                { value: 'views', label: 'Mais vistos' },
              ]}
              value={order}
              onChange={(value) => setOrder(value as TerritoryOrder)}
            />
            <AppButton
              title="Limpar filtros"
              variant="quiet"
              onPress={resetFilters}
            />
          </View>
        )}
        {Platform.OS !== 'web' && (
          <SlidingTabs
            tabs
            scroll={false}
            label="Visualização do território"
            options={[
              { value: 'map', label: 'Mapa', icon: 'map-outline' },
              { value: 'list', label: 'Lista', icon: 'list-outline' },
            ]}
            value={map ? 'map' : 'list'}
            onChange={(value) => {
              setMap(value === 'map');
              setAreaOnly(false);
            }}
          />
        )}
        {!municipality && (
          <AppText color="muted">
            Confirme seu município no perfil para explorar o território.
          </AppText>
        )}
        {showOccurrences &&
          (occurrences.isLoading ||
            occurrences.error ||
            occurrences.fetchStatus === 'paused') && (
            <View style={{ gap: spacing.xs }}>
              {occurrences.error && (
                <AppText variant="label">Ocorrências</AppText>
              )}
              <QueryState
                loading={occurrences.isLoading}
                error={occurrences.error}
                retry={occurrences.refetch}
              />
              {occurrences.fetchStatus === 'paused' && (
                <AppText color="muted">
                  Ocorrências aguardando conexão. Os dados já carregados
                  continuam disponíveis.
                </AppText>
              )}
            </View>
          )}
        {showCivic &&
          (civic.isLoading ||
            civic.error ||
            civic.fetchStatus === 'paused') && (
            <View style={{ gap: spacing.xs }}>
              {civic.error && (
                <AppText variant="label">Propostas, consultas e ações</AppText>
              )}
              <QueryState
                loading={civic.isLoading}
                error={civic.error}
                retry={civic.refetch}
              />
              {civic.fetchStatus === 'paused' && (
                <AppText color="muted">
                  Participações aguardando conexão. Os dados já carregados
                  continuam disponíveis.
                </AppText>
              )}
            </View>
          )}
        {locationMessage !== '' && (
          <AppText color="muted" accessibilityLiveRegion="polite">
            {locationMessage}
          </AppText>
        )}
        {map && (
          <View style={cityStyles.section}>
            <View style={styles.mapFrame}>
              <OsmMapView
                style={styles.map}
                region={region}
                markers={osmMarkers}
                isDark={mode === 'dark'}
                onMarkerClick={(id) => setSelectedId(id)}
                onRegionChange={(newRegion) => {
                  setRegion((curr) => ({
                    ...curr,
                    latitude: newRegion.latitude,
                    longitude: newRegion.longitude,
                    latitudeDelta: newRegion.latitudeDelta,
                    longitudeDelta: newRegion.longitudeDelta,
                  }));
                }}
              />
              <View style={styles.mapActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Minha posição"
                  accessibilityState={{ disabled: locating, busy: locating }}
                  disabled={locating}
                  onPress={() => {
                    void locate();
                  }}
                  style={styles.mapCircle}
                >
                  <Ionicons
                    name="locate-outline"
                    size={22}
                    color={colors.ink}
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Voltar ao município"
                  onPress={() => {
                    setRegion(initial);
                    setAreaOnly(false);
                    setSelectedId(null);
                  }}
                  style={styles.mapCircle}
                >
                  <Ionicons
                    name="expand-outline"
                    size={22}
                    color={colors.ink}
                  />
                </Pressable>
              </View>
            </View>
            <AppButton
              title={
                areaOnly ? 'Mostrar todo o território' : 'Buscar nesta área'
              }
              variant="secondary"
              onPress={() => setAreaOnly(!areaOnly)}
            />
            {selectedEntry ? (
              renderEntry(selectedEntry)
            ) : (
              <AppText variant="meta" color="muted">
                Toque em um ponto para ver o registro.
              </AppText>
            )}
            {unlocated.length > 0 && (
              <AppButton
                title={
                  (showUnlocated ? 'Ocultar' : 'Ver') +
                  ' participações sem ponto no mapa · ' +
                  unlocated.length
                }
                variant="quiet"
                onPress={() => setShowUnlocated(!showUnlocated)}
              />
            )}
          </View>
        )}
        {!map && (
          <View style={cityStyles.section}>
            <AppText variant="sectionTitle">
              {areaOnly ? 'Itens na área visível' : 'Lista do território'}
            </AppText>
            {listed.map(renderEntry)}
            {dataReady && listed.length === 0 && (
              <IllustratedEmptyState
                kind="territory"
                title="Nenhum resultado neste recorte"
                description="Nenhuma ocorrência, proposta, consulta ou ação encontrada com os filtros atuais."
                action={{
                  title: 'Limpar filtros',
                  onPress: resetFilters,
                }}
              />
            )}
          </View>
        )}
        {map && showUnlocated && unlocated.length > 0 && (
          <View style={cityStyles.section}>
            <AppText variant="sectionTitle">
              Sem ponto específico · {unlocated.length}
            </AppText>
            <AppText color="muted">
              Abrangem o município ou um bairro, sem localização para comparar
              com a área do mapa.
            </AppText>
            {unlocated.map(renderEntry)}
          </View>
        )}
        <AppButton
          title="Participar da cidade"
          onPress={() => router.push('/(tabs)/ParticipateScreen')}
        />
      </ScrollView>
    </AppScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    flex: { flex: 1, gap: spacing.xxs },
    filterButton: {
      minHeight: layout.touchTarget.minHeight,
      paddingHorizontal: spacing.md,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    filterSelected: { backgroundColor: colors.ink },
    filters: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: layout.radius.card,
      backgroundColor: colors.surface,
    },
    viewToggle: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: layout.radius.pill,
      padding: spacing.xxs,
    },
    viewTab: {
      flex: 1,
      minHeight: layout.touchTarget.minHeight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      borderRadius: layout.radius.pill,
    },
    viewSelected: { backgroundColor: colors.ink },
    mapFrame: {
      borderRadius: layout.radius.card,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: colors.surfaceSubdued,
    },
    map: { height: 360, width: '100%' },
    mapActions: {
      position: 'absolute',
      right: spacing.sm,
      top: spacing.sm,
      gap: spacing.xs,
    },
    mapCircle: {
      width: layout.touchTarget.minWidth,
      height: layout.touchTarget.minHeight,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
