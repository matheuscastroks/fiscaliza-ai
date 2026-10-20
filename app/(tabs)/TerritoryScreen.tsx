import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { layout } from '@/theme/layout';
import React, { useMemo, useState, useEffect } from 'react';
import {
  Modal,
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
import { AppSelect } from '@/components/ui/AppSelect';
import { CitySearch } from '@/components/ui/CitySearch';
import {
  QueryState,
  createCityStyles,
} from '@/features/city/CityUI';
import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { SlidingTabs } from '@/components/ui/SlidingTabs';
import { inMapRegion } from '@/shared/territory';
import type { OfficialCall } from '@/shared/contracts';
import {
  useOfficialCalls,
  useOfficialFilters,
  useOfficialOverview,
} from '@/features/city/useOfficialCalls';
import { OfficialCallRow } from '@/components/official/OfficialCallRow';
import { spacing } from '@/theme/spacing';
import { useAuthStore } from '@/stores/authStore';
import { useTerritorySelection, useTerritoryViewMode } from '@/stores/territoryStore';
import { municipalityRegion } from '@/features/city/municipalContext';
import { OsmMapView, type MapMarker } from '@/components/ui/OsmMapView';
import { TerritoryPreviewCard, type Entry } from '@/components/territory/TerritoryPreviewCard';
import { TerritoryClusterCarousel } from '@/components/territory/TerritoryClusterCarousel';

type TerritoryMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  zoom?: number;
};

const locatedOfficialCall = (item: OfficialCall) =>
  item.latitude !== null &&
  item.latitude !== undefined &&
  item.longitude !== null &&
  item.longitude !== undefined &&
  Number.isFinite(item.latitude) &&
  Number.isFinite(item.longitude) &&
  Math.abs(item.latitude) <= 90 &&
  Math.abs(item.longitude) <= 180
    ? { latitude: item.latitude, longitude: item.longitude }
    : undefined;

const entryLocation = (entry: Entry) => {
  if (entry.type === 'official') return locatedOfficialCall(entry.item);
  return undefined;
};

export default function TerritoryScreen() {
  const user = useAuthStore((state) => state.user);
  return <TerritoryContent key={user?.id + ':' + user?.municipality?.id} />;
}

function TerritoryContent() {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const cityStyles = useThemedStyles(createCityStyles);
  const styles = useThemedStyles(createStyles);

  const user = useAuthStore((state) => state.user);
  const municipality = user?.municipality;
  const initial = useMemo(
    () => ({
      ...municipalityRegion(municipality),
      zoom: 12,
    }),
    [municipality],
  );

  const { neighborhood, setNeighborhood } = useTerritorySelection();
  const [region, setRegion] = useState<TerritoryMapRegion>(initial);
  const [areaOnly, setAreaOnly] = useState(false);
  const [serviceType, setServiceType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const { isListView, setIsListView } = useTerritoryViewMode();

  const officialFilters = useOfficialFilters();
  const officialOverview = useOfficialOverview();
  const officialCalls = useOfficialCalls({
    bairro: neighborhood || undefined,
    tipo: serviceType === 'all' ? undefined : serviceType,
    situacao: status === 'all' ? undefined : status,
    search: search || undefined,
    limit: 500,
    hasCoordinates: isListView ? undefined : true,
  });

  const bairroOptions = officialFilters.data?.bairros || [];

  const serviceTypeOptions = useMemo(() => {
    const allTypes = officialFilters.data?.tipos || [];
    const topTypes = officialOverview.data?.topServices?.map((s) => s.type) || [];
    const merged = Array.from(new Set([...topTypes, ...allTypes]));
    return [
      { value: 'all', label: 'Todos os serviços' },
      ...merged.map((t) => ({ value: t, label: t })),
    ];
  }, [officialOverview.data?.topServices, officialFilters.data?.tipos]);

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'Todas situações' },
      { value: 'Não Encerrado', label: 'Em atendimento' },
      { value: 'Encerrado', label: 'Encerrados' },
    ],
    [],
  );

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
  const [selectedCluster, setSelectedCluster] = useState<{
    ids: string[];
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showUnlocated, setShowUnlocated] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (focusId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(focusId);
      setSelectedCluster(null);
      setIsListView(false);
      setAreaOnly(false);
      setStatus('all');
      setServiceType('all');
      setSearch('');

      if (paramNeighborhood) {
        setNeighborhood(paramNeighborhood);
      }

      let targetLat = lat ? Number(lat) : NaN;
      let targetLng = lng ? Number(lng) : NaN;
      if (!Number.isFinite(targetLat) || !Number.isFinite(targetLng)) {
        const off = officialCalls.data?.calls?.find((i) => i.id === focusId);
        if (off && off.latitude != null && off.longitude != null) {
          targetLat = off.latitude;
          targetLng = off.longitude;
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
    officialCalls.data?.calls,
    setIsListView,
    setNeighborhood,
  ]);

  const entries = useMemo<Entry[]>(() => {
    const calls = officialCalls.data?.calls || [];
    return calls.map((item) => ({ type: 'official' as const, item }));
  }, [officialCalls.data?.calls]);

  const unlocated = entries.filter((entry) => !entryLocation(entry));
  const located = entries.filter((entry) => {
    const point = entryLocation(entry);
    return point && (!areaOnly || inMapRegion(point, region));
  });
  const listed = areaOnly ? located : entries;

  const selectedEntry = useMemo<Entry | null>(() => {
    if (!selectedId) return null;
    const fromEntries = entries.find((entry) => entry.item.id === selectedId);
    if (fromEntries) return fromEntries;
    const off = officialCalls.data?.calls?.find((item) => item.id === selectedId);
    if (off) return { type: 'official' as const, item: off };
    return null;
  }, [selectedId, entries, officialCalls.data?.calls]);

  const selectedClusterEntries = useMemo<Entry[]>(() => {
    if (!selectedCluster || selectedCluster.ids.length === 0) return [];
    const idSet = new Set(selectedCluster.ids);
    const matched: Entry[] = [];
    for (const entry of entries) {
      if (idSet.has(entry.item.id)) {
        matched.push(entry);
      }
    }
    return matched;
  }, [selectedCluster, entries]);

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
    Number(serviceType !== 'all') +
    Number(areaOnly);

  const dataReady = officialCalls.data !== undefined;

  const openEntry = (entry: Entry) => {
    router.push({
      pathname: '/OfficialCallDetailsScreen',
      params: { id: entry.item.id },
    });
  };

  const renderEntry = (entry: Entry) => {
    if (entry.type !== 'official') return null;
    return (
      <View key={entry.item.id}>
        <OfficialCallRow call={entry.item} onPress={() => openEntry(entry)} />
      </View>
    );
  };

  const osmMarkers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = located.flatMap((entry): MapMarker[] => {
      if (entry.type !== 'official') return [];
      const point = entryLocation(entry);
      if (!point) return [];
      const isClosed = entry.item.officialSituation === 'Encerrado';
      return [
        {
          id: entry.item.id,
          latitude: point.latitude,
          longitude: point.longitude,
          title: `1746 · ${entry.item.serviceSubtype || entry.item.serviceType}`,
          color: isClosed ? '#236B50' : '#0072BB',
          kind: 'official',
        },
      ];
    });

    if (
      selectedEntry &&
      selectedEntry.type === 'official' &&
      !list.some((m) => m.id === selectedEntry.item.id)
    ) {
      const point = entryLocation(selectedEntry);
      if (point) {
        const isClosed = selectedEntry.item.officialSituation === 'Encerrado';
        list.push({
          id: selectedEntry.item.id,
          latitude: point.latitude,
          longitude: point.longitude,
          title: `1746 · ${selectedEntry.item.serviceSubtype || selectedEntry.item.serviceType}`,
          color: isClosed ? '#236B50' : '#0072BB',
          kind: 'official',
        });
      }
    }

    return list;
  }, [located, selectedEntry]);

  const resetFilters = () => {
    setSearch('');
    setServiceType('all');
    setSelectedId(null);
    setSelectedCluster(null);
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
        latitudeDelta: 0.018,
        longitudeDelta: 0.018,
        zoom: 15,
      }));
      setLocationMessage('');
    } catch {
      setLocationMessage('Não foi possível obter a localização atual.');
    } finally {
      setLocating(false);
    }
  };

  const renderCompactFilterStrip = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.compactFilterStrip}
    >
      <NeighborhoodPicker
        compact
        options={bairroOptions}
        value={neighborhood}
        onChange={(value) => {
          setNeighborhood(value);
          setSelectedId(null);
          setSelectedCluster(null);
        }}
      />

      <AppSelect
        compact
        label="Tipo de serviço 1746"
        placeholder="Buscar serviço (ex: iluminação, entulho...)"
        icon="construct-outline"
        defaultValue="all"
        options={serviceTypeOptions}
        value={serviceType}
        onChange={(value) => {
          setServiceType(value);
          setSelectedId(null);
          setSelectedCluster(null);
        }}
      />

      <AppSelect
        compact
        label="Situação do chamado"
        icon="pulse-outline"
        defaultValue="all"
        options={statusOptions}
        value={status}
        onChange={(value) => {
          setStatus(value);
          setSelectedId(null);
          setSelectedCluster(null);
        }}
      />

      <View style={[styles.resultsBadge, { backgroundColor: colors.surface + 'F2' }]}>
        <AppText variant="caption" color="muted" style={{ fontWeight: '700' }}>
          {officialCalls.isLoading ? '...' : `${listed.length}`}
        </AppText>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {locationMessage !== '' && (
        <View style={[styles.messageBanner, { top: insets.top + 100, backgroundColor: colors.surface }]}>
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
          selectedClusterIds={selectedCluster?.ids || null}
          isDark={mode === 'dark'}
          onMarkerClick={(id) => {
            setSelectedId(id);
            setSelectedCluster(null);
          }}
          onClusterClick={(event) => {
            setSelectedCluster(event);
            setSelectedId(null);
          }}
          onMapClick={() => {
            setSelectedId(null);
            setSelectedCluster(null);
          }}
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

      {/* 2. TOP FLOATING HEADER COMPACTO (BUSCA + BARRA DE SELECTS) */}
      {!isListView && (
        <View style={[styles.topFloatingHeader, { paddingTop: insets.top + spacing.xs }]}>
          <View style={styles.searchContainer}>
            <CitySearch
              value={search}
              onChangeText={setSearch}
              onFilters={() => setFiltersOpen(true)}
              expanded={filtersOpen}
              filterCount={filterCount}
            />
          </View>

          {renderCompactFilterStrip()}
        </View>
      )}

      {/* 3. BOTÕES FLUTUANTES LATERAIS (GPS, RESET) */}
      {!isListView && (
        <View style={[styles.mapActionsRight, { top: insets.top + 112 }]}>
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
              size={20}
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
              setSelectedCluster(null);
            }}
            style={[styles.floatingCircleButton, { backgroundColor: colors.surface }]}
          >
            <Ionicons
              name="expand-outline"
              size={20}
              color={colors.ink}
            />
          </Pressable>
        </View>
      )}

      {/* 4. BOTÃO 'BUSCAR NESTA ÁREA' */}
      {!isListView && !selectedEntry && selectedClusterEntries.length === 0 && (
        <View style={[styles.areaButtonWrapper, { bottom: insets.bottom + 95 }]}>
          <Pressable
            style={[styles.areaPillButton, { backgroundColor: colors.surface }]}
            onPress={() => setAreaOnly(!areaOnly)}
          >
            <Ionicons
              name={areaOnly ? 'globe-outline' : 'scan-outline'}
              size={15}
              color={colors.ink}
            />
            <AppText variant="caption" style={{ fontWeight: '700' }}>
              {areaOnly ? 'Mostrar todo o município' : 'Buscar nesta área'}
            </AppText>
          </Pressable>
        </View>
      )}

      {/* 5. BOTTOM PREVIEW CARDS (INDIVIDUAL OU CARROSSEL DE CLUSTER) */}
      {!isListView && selectedClusterEntries.length > 1 && (
        <TerritoryClusterCarousel
          entries={selectedClusterEntries}
          onOpen={openEntry}
          onClose={() => setSelectedCluster(null)}
          onZoomCluster={() => {
            if (selectedCluster) {
              const targetLat = selectedCluster.latitude;
              const targetLng = selectedCluster.longitude;
              setSelectedCluster(null);
              setRegion((curr: TerritoryMapRegion) => ({
                ...curr,
                latitude: targetLat,
                longitude: targetLng,
                zoom: Math.max(16, Math.min(18, (curr.zoom ?? 14) + 2)),
              }));
            }
          }}
          bottomOffset={insets.bottom + 85}
        />
      )}

      {!isListView && selectedClusterEntries.length === 1 && (
        <TerritoryPreviewCard
          entry={selectedClusterEntries[0]}
          onOpen={openEntry}
          onClose={() => setSelectedCluster(null)}
          bottomOffset={insets.bottom + 85}
        />
      )}

      {!isListView && selectedClusterEntries.length === 0 && selectedEntry && (
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
            title="Território · Central 1746"
            context="Rio de Janeiro · RJ · Dados Oficiais DATA.RIO"
          />

          <View style={styles.listFilterBar}>
            <View style={{ paddingHorizontal: spacing.md }}>
              <CitySearch
                value={search}
                onChangeText={setSearch}
                onFilters={() => setFiltersOpen(true)}
                expanded={filtersOpen}
                filterCount={filterCount}
              />
            </View>

            <View style={{ paddingHorizontal: spacing.md }}>
              {renderCompactFilterStrip()}
            </View>
          </View>

          <ScrollView
            contentContainerStyle={[cityStyles.content, { paddingBottom: insets.bottom + 100 }]}
          >
            {(officialCalls.isLoading ||
              officialCalls.error ||
              officialCalls.fetchStatus === 'paused') && (
              <View style={{ gap: spacing.xs }}>
                <QueryState
                  loading={officialCalls.isLoading}
                  error={officialCalls.error}
                  retry={officialCalls.refetch}
                />
              </View>
            )}
            <View style={cityStyles.section}>
              <AppText variant="sectionTitle">
                {areaOnly ? 'Chamados na área visível' : 'Chamados da Central 1746'} ({listed.length})
              </AppText>
              {listed.map(renderEntry)}
              {dataReady && listed.length === 0 && (
                <IllustratedEmptyState
                  kind="territory"
                  title="Nenhum chamado 1746 neste recorte"
                  description="Nenhum chamado oficial encontrado com os filtros atuais."
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
                    ' chamados sem coordenada exata · ' +
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

      {/* 7. MODAL DE FILTROS COMPACTO (BOTTOM SHEET) */}
      <Modal
        visible={filtersOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFiltersOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setFiltersOpen(false)}
          />
          <View
            style={[
              styles.filterModalSheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, spacing.md),
              },
            ]}
          >
            <View style={styles.sheetHandleBar}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.divider }]} />
            </View>

            <View style={styles.filterModalHeader}>
              <AppText variant="sectionTitle" style={{ fontSize: 18 }}>
                Filtros do Território
              </AppText>
              <Pressable
                onPress={() => setFiltersOpen(false)}
                hitSlop={12}
                style={[styles.closeButton, { backgroundColor: colors.surfaceSubdued }]}
              >
                <Ionicons name="close" size={18} color={colors.ink} />
              </Pressable>
            </View>

            <View style={styles.filterModalBody}>
              <View style={styles.filterField}>
                <AppText variant="caption" color="muted" style={styles.filterLabel}>
                  BAIRRO
                </AppText>
                <NeighborhoodPicker
                  options={bairroOptions}
                  value={neighborhood}
                  onChange={(value) => {
                    setNeighborhood(value);
                    setSelectedId(null);
                  }}
                />
              </View>

              <View style={styles.filterField}>
                <AppText variant="caption" color="muted" style={styles.filterLabel}>
                  TIPO DE SERVIÇO (CENTRAL 1746)
                </AppText>
                <AppSelect
                  label="Tipo de serviço 1746"
                  placeholder="Buscar tipo de serviço..."
                  icon="construct-outline"
                  defaultValue="all"
                  options={serviceTypeOptions}
                  value={serviceType}
                  onChange={(value) => {
                    setServiceType(value);
                    setSelectedId(null);
                  }}
                />
              </View>

              <View style={styles.filterField}>
                <AppText variant="caption" color="muted" style={styles.filterLabel}>
                  SITUAÇÃO DO CHAMADO
                </AppText>
                <SlidingTabs
                  label="Situação"
                  scroll={false}
                  edgeToEdge={false}
                  options={[
                    { value: 'all', label: 'Todas' },
                    { value: 'Não Encerrado', label: 'Abertos' },
                    { value: 'Encerrado', label: 'Encerrados' },
                  ]}
                  value={status}
                  onChange={(value) => {
                    setStatus(value);
                    setSelectedId(null);
                  }}
                />
              </View>

              <View style={styles.filterField}>
                <AppText variant="caption" color="muted" style={styles.filterLabel}>
                  RECORTE ESPACIAL
                </AppText>
                <SlidingTabs
                  label="Recorte espacial"
                  scroll={false}
                  edgeToEdge={false}
                  options={[
                    { value: 'all', label: 'Todo o Rio' },
                    { value: 'area', label: 'Área visível no mapa' },
                  ]}
                  value={areaOnly ? 'area' : 'all'}
                  onChange={(value) => {
                    setAreaOnly(value === 'area');
                    setSelectedId(null);
                  }}
                />
              </View>

              <View style={styles.filterActionsRow}>
                <AppButton
                  title="Limpar tudo"
                  variant="quiet"
                  onPress={resetFilters}
                />
                <AppButton
                  title={`Ver ${listed.length} chamados`}
                  variant="primary"
                  onPress={() => setFiltersOpen(false)}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
      gap: 8,
    },
    searchContainer: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    compactFilterStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 2,
    },
    listFilterBar: {
      paddingBottom: spacing.xs,
      gap: 8,
      backgroundColor: colors.canvas,
      zIndex: 10,
    },
    resultsBadge: {
      height: 36,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: layout.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    filterModalSheet: {
      borderTopLeftRadius: layout.radius.sheet,
      borderTopRightRadius: layout.radius.sheet,
      paddingTop: spacing.xs,
    },
    sheetHandleBar: {
      alignItems: 'center',
      paddingVertical: 6,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
    },
    filterModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterModalBody: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      gap: spacing.md,
    },
    filterField: {
      gap: 6,
    },
    filterLabel: {
      fontWeight: '700',
      letterSpacing: 0.5,
      fontSize: 11,
    },
    filterActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    mapActionsRight: {
      position: 'absolute',
      right: spacing.md,
      zIndex: 40,
      gap: spacing.xs,
    },
    floatingCircleButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.14,
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
      paddingVertical: 8,
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
