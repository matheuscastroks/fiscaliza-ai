import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { layout } from '@/theme/layout';
import React, { useMemo, useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
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
import { useTerritorySelection, useTerritoryViewMode } from '@/stores/territoryStore';
import { municipalityRegion } from '@/features/city/municipalContext';
import { OsmMapView, type MapMarker } from '@/components/ui/OsmMapView';
import { TerritoryPreviewCard, type Entry } from '@/components/territory/TerritoryPreviewCard';

type TerritoryMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  zoom?: number;
};

type Kind = 'all' | 'occurrences' | CivicItem['kind'];

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
  const insets = useSafeAreaInsets();
  const pinColors = useMemo(
    () => ({
      proposal: colors.attention,
      consultation: colors.muted,
      action: colors.completed,
    }),
    [colors.attention, colors.muted, colors.completed],
  );
  const cityStyles = useThemedStyles(createCityStyles);
  const styles = useThemedStyles(createStyles);

  const [order, setOrder] = useState<TerritoryOrder>('date');
  const [period, setPeriod] = useState(0);
  const user = useAuthStore((state) => state.user);
  const municipality = user?.municipality;
  const initial = useMemo(
    () => ({
      ...municipalityRegion(municipality),
      zoom: 12,
    }),
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
  const [region, setRegion] = useState<TerritoryMapRegion>(initial);
  const [areaOnly, setAreaOnly] = useState(false);
  const [kind, setKind] = useState<Kind>('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { isListView, setIsListView } = useTerritoryViewMode();
  const {
    filters,
    focusId,
    lat,
    lng,
    neighborhood: paramNeighborhood,
  } = useLocalSearchParams<{
    filters?: string;
    focusId?: string;
    lat?: string;
    lng?: string;
    neighborhood?: string;
  }>();
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

  useEffect(() => {
    if (focusId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(focusId);
      setIsListView(false);
      setAreaOnly(false);
      setStatus('all');
      setKind('all');
      setSearch('');

      if (paramNeighborhood) {
        setNeighborhood(paramNeighborhood);
      }

      let targetLat = lat ? Number(lat) : NaN;
      let targetLng = lng ? Number(lng) : NaN;
      if (!Number.isFinite(targetLat) || !Number.isFinite(targetLng)) {
        const occ = occurrences.data?.find((i) => i.id === focusId);
        if (occ) {
          targetLat = occ.location.latitude;
          targetLng = occ.location.longitude;
        } else {
          const civ = civic.data?.find((i) => i.id === focusId);
          if (civ) {
            const loc = civicLocation(civ);
            if (loc) {
              targetLat = loc.latitude;
              targetLng = loc.longitude;
            }
          }
        }
      }

      if (Number.isFinite(targetLat) && Number.isFinite(targetLng)) {
        setRegion((prev: TerritoryMapRegion) => ({
          ...prev,
          latitude: targetLat,
          longitude: targetLng,
          zoom: 17,
        }));
      }
    }
  }, [
    focusId,
    lat,
    lng,
    paramNeighborhood,
    occurrences.data,
    civic.data,
    setIsListView,
    setNeighborhood,
  ]);

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
  const selectedEntry = useMemo(() => {
    if (!selectedId) return null;
    const fromEntries = entries.find((entry) => entry.item.id === selectedId);
    if (fromEntries) return fromEntries;
    const occ = occurrences.data?.find((item) => item.id === selectedId);
    if (occ) return { type: 'occurrence' as const, item: occ };
    const civ = civic.data?.find((item) => item.id === selectedId);
    if (civ) return { type: 'civic' as const, item: civ };
    return null;
  }, [selectedId, entries, occurrences.data, civic.data]);

  const municipalOverviewRegion = useMemo(() => {
    const points = entries
      .map((entry) => entryLocation(entry))
      .filter((pt): pt is { latitude: number; longitude: number } => Boolean(pt));

    if (points.length === 0) {
      return initial;
    }

    let minLat = points[0].latitude;
    let maxLat = points[0].latitude;
    let minLng = points[0].longitude;
    let maxLng = points[0].longitude;

    for (const p of points) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }

    const latDelta = Math.max(0.04, (maxLat - minLat) * 1.35);
    const lngDelta = Math.max(0.04, (maxLng - minLng) * 1.35);
    const delta = Math.max(latDelta, lngDelta, 0.001);
    const calculatedZoom = Math.max(
      11,
      Math.min(15, Math.round(Math.log2(360 / delta))),
    );

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
      zoom: calculatedZoom,
    };
  }, [entries, initial]);

  const filterCount =
    Number(Boolean(neighborhood)) +
    Number(status !== 'all') +
    Number(areaOnly) +
    Number(period !== 0) +
    Number(order !== 'date');

  const statuses: [string, string][] =
    kind === 'occurrences'
      ? [
          ['pending', 'Recebida'],
          ['in_progress', 'Em atendimento'],
          ['resolved', 'Concluída'],
        ]
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

  const osmMarkers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = located.flatMap((entry) => {
      const point = entryLocation(entry);
      if (!point) return [];
      const markerKind =
        entry.type === 'occurrence' ? 'occurrence' : entry.item.kind;
      return [
        {
          id: entry.item.id,
          latitude: point.latitude,
          longitude: point.longitude,
          title: `${entry.type === 'occurrence' ? 'Ocorrência' : kindLabel[entry.item.kind]} · ${entry.item.title}`,
          color:
            entry.type === 'occurrence'
              ? colors.accent
              : pinColors[entry.item.kind],
          kind: markerKind,
        },
      ];
    });

    if (selectedEntry && !list.some((m) => m.id === selectedEntry.item.id)) {
      const point = entryLocation(selectedEntry);
      if (point) {
        list.push({
          id: selectedEntry.item.id,
          latitude: point.latitude,
          longitude: point.longitude,
          title: `${selectedEntry.type === 'occurrence' ? 'Ocorrência' : kindLabel[selectedEntry.item.kind]} · ${selectedEntry.item.title}`,
          color:
            selectedEntry.type === 'occurrence'
              ? colors.accent
              : pinColors[selectedEntry.item.kind],
          kind:
            selectedEntry.type === 'occurrence'
              ? 'occurrence'
              : selectedEntry.item.kind,
        });
      }
    }

    return list;
  }, [located, selectedEntry, colors.accent, pinColors]);

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
      setRegion((current: TerritoryMapRegion) => ({
        ...current,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        zoom: 16,
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

  const renderFilterDrawer = () => (
    <View style={[styles.filtersDrawer, { backgroundColor: colors.surface }]}>
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
            options={[['all', 'Todas'], ...statuses].map(([val, lab]) => ({
              value: val,
              label: lab,
            }))}
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
      <View style={styles.filterActionsRow}>
        <AppButton
          title="Limpar filtros"
          variant="quiet"
          onPress={resetFilters}
        />
        <AppButton
          title="Fechar"
          variant="secondary"
          onPress={() => setFiltersOpen(false)}
        />
      </View>
    </View>
  );

  const renderCategoryChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryScroll}
    >
      <SlidingTabs
        label="Categorias"
        edgeToEdge={false}
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
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {locationMessage !== '' && (
        <View style={[styles.messageBanner, { top: insets.top + 70, backgroundColor: colors.surface }]}>
          <AppText variant="caption" color="muted" accessibilityLiveRegion="polite">
            {locationMessage}
          </AppText>
        </View>
      )}

      {/* 1. MAPA DE FUNDO EDGE-TO-EDGE */}
      <View style={StyleSheet.absoluteFill}>
        <OsmMapView
          style={StyleSheet.absoluteFill}
          region={region}
          markers={osmMarkers}
          selectedId={selectedId}
          isDark={mode === 'dark'}
          onMarkerClick={(id) => setSelectedId(id)}
          onMapClick={() => setSelectedId(null)}
          onRegionChange={(newRegion) => {
            setRegion((curr: TerritoryMapRegion) => ({
              ...curr,
              latitude: newRegion.latitude,
              longitude: newRegion.longitude,
              latitudeDelta: newRegion.latitudeDelta,
              longitudeDelta: newRegion.longitudeDelta,
              zoom: newRegion.zoom ?? curr.zoom,
            }));
          }}
        />
      </View>

      {/* 2. TOP FLOATING HEADER (BUSCA + CHIPS DE CATEGORIA + FILTROS - NO MAPA) */}
      {!isListView && (
        <View style={[styles.topFloatingHeader, { paddingTop: insets.top + spacing.xs }]}>
          <View style={styles.searchContainer}>
            <CitySearch
              value={search}
              onChangeText={setSearch}
              onFilters={() => setFiltersOpen(!filtersOpen)}
              expanded={filtersOpen}
              filterCount={filterCount}
            />
          </View>

          {renderCategoryChips()}

          {/* CONTADOR DE RESULTADOS RÁPIDO */}
          <View style={styles.resultsBadgeRow}>
            <View style={[styles.resultsBadge, { backgroundColor: colors.surface + 'EE' }]}>
              <AppText variant="caption" style={{ fontWeight: '700' }}>
                {listed.length} {listed.length === 1 ? 'registro' : 'registros'}
                {areaOnly ? ' nesta área' : ''}
              </AppText>
            </View>
          </View>

          {/* FILTROS AVANÇADOS EXPANSÍVEIS (MODAL / GAVETA) */}
          {filtersOpen && renderFilterDrawer()}
        </View>
      )}

      {/* 3. BOTÕES FLUTUANTES LATERAIS (GPS, RESET, BUSCAR NESTA ÁREA) */}
      {!isListView && (
        <View style={[styles.mapActionsRight, { top: insets.top + 160 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Minha posição"
            accessibilityState={{ disabled: locating, busy: locating }}
            disabled={locating}
            onPress={() => {
              void locate();
            }}
            style={[styles.floatingCircleButton, { backgroundColor: colors.surface }]}
          >
            <Ionicons
              name="locate"
              size={22}
              color={locating ? colors.accent : colors.ink}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar ao município"
            onPress={() => {
              setRegion(municipalOverviewRegion);
              setAreaOnly(false);
              setSelectedId(null);
            }}
            style={[styles.floatingCircleButton, { backgroundColor: colors.surface }]}
          >
            <Ionicons
              name="expand-outline"
              size={22}
              color={colors.ink}
            />
          </Pressable>
        </View>
      )}

      {/* 4. BOTÃO 'BUSCAR NESTA ÁREA' QUANDO MOVE O MAPA */}
      {!isListView && !selectedEntry && (
        <View style={[styles.areaButtonWrapper, { bottom: insets.bottom + 95 }]}>
          <Pressable
            style={[styles.areaPillButton, { backgroundColor: colors.surface }]}
            onPress={() => setAreaOnly(!areaOnly)}
          >
            <Ionicons
              name={areaOnly ? 'globe-outline' : 'scan-outline'}
              size={16}
              color={colors.ink}
            />
            <AppText variant="caption" style={{ fontWeight: '700' }}>
              {areaOnly ? 'Mostrar todo o município' : 'Buscar nesta área'}
            </AppText>
          </Pressable>
        </View>
      )}

      {/* 5. BOTTOM PREVIEW CARD (QUANDO UM PINO É SELECIONADO) */}
      {!isListView && selectedEntry && (
        <TerritoryPreviewCard
          entry={selectedEntry}
          onOpen={openEntry}
          onClose={() => setSelectedId(null)}
          bottomOffset={insets.bottom + 85}
        />
      )}

      {/* 6. VISUALIZAÇÃO EM LISTA (QUANDO ATIVADA) */}
      {isListView && (
        <View
          style={[
            styles.fullListOverlay,
            { backgroundColor: colors.canvas, paddingTop: insets.top },
          ]}
        >
          <AppHeader
            title="Território"
            context={
              municipality
                ? `${municipality.name} · ${municipality.state}`
                : 'Seu município'
            }
          />

          {/* FILTROS INTEGRADOS NA VISUALIZAÇÃO EM LISTA */}
          <View style={styles.listFilterBar}>
            <View style={{ paddingHorizontal: spacing.md }}>
              <CitySearch
                value={search}
                onChangeText={setSearch}
                onFilters={() => setFiltersOpen(!filtersOpen)}
                expanded={filtersOpen}
                filterCount={filterCount}
              />
            </View>

            {renderCategoryChips()}

            <View style={[styles.resultsBadgeRow, { paddingHorizontal: spacing.md }]}>
              <View style={[styles.resultsBadge, { backgroundColor: colors.surface }]}>
                <AppText variant="caption" style={{ fontWeight: '700' }}>
                  {listed.length} {listed.length === 1 ? 'registro' : 'registros'}
                  {areaOnly ? ' nesta área' : ''}
                </AppText>
              </View>
            </View>

            {filtersOpen && (
              <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.xs }}>
                {renderFilterDrawer()}
              </View>
            )}
          </View>

          <ScrollView
            contentContainerStyle={[cityStyles.content, { paddingBottom: insets.bottom + 100 }]}
          >
            {showOccurrences &&
              (occurrences.isLoading ||
                occurrences.error ||
                occurrences.fetchStatus === 'paused') && (
                <View style={{ gap: spacing.xs }}>
                  <QueryState
                    loading={occurrences.isLoading}
                    error={occurrences.error}
                    retry={occurrences.refetch}
                  />
                </View>
              )}
            {showCivic &&
              (civic.isLoading ||
                civic.error ||
                civic.fetchStatus === 'paused') && (
                <View style={{ gap: spacing.xs }}>
                  <QueryState
                    loading={civic.isLoading}
                    error={civic.error}
                    retry={civic.refetch}
                  />
                </View>
              )}
            <View style={cityStyles.section}>
              <AppText variant="sectionTitle">
                {areaOnly ? 'Itens na área visível' : 'Lista do território'} ({listed.length})
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
            {unlocated.length > 0 && (
              <View style={cityStyles.section}>
                <AppButton
                  title={
                    (showUnlocated ? 'Ocultar' : 'Ver') +
                    ' participações sem ponto no mapa · ' +
                    unlocated.length
                  }
                  variant="quiet"
                  onPress={() => setShowUnlocated(!showUnlocated)}
                />
                {showUnlocated && unlocated.map(renderEntry)}
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    messageBanner: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      zIndex: 55,
      padding: spacing.xs,
      borderRadius: layout.radius.button,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    topFloatingHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    searchContainer: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 4,
    },
    categoryScroll: {
      paddingVertical: 2,
      gap: spacing.xs,
    },
    listFilterBar: {
      paddingBottom: spacing.xs,
      gap: spacing.xs,
      backgroundColor: colors.canvas,
      zIndex: 10,
    },
    resultsBadgeRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    resultsBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: layout.radius.pill,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    filtersDrawer: {
      marginTop: spacing.xs,
      padding: spacing.md,
      borderRadius: layout.radius.card,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 14,
      elevation: 6,
      gap: spacing.sm,
      maxHeight: 400,
    },
    filterActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    mapActionsRight: {
      position: 'absolute',
      right: spacing.md,
      zIndex: 40,
      gap: spacing.xs,
    },
    floatingCircleButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    areaButtonWrapper: {
      position: 'absolute',
      alignSelf: 'center',
      zIndex: 40,
    },
    areaPillButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 9,
      borderRadius: layout.radius.pill,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 8,
      elevation: 5,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    fullListOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 60,
    },
  });
