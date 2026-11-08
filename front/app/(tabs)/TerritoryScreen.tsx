import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { mapPerformanceEnabled, mapPerformanceVariant } from '@/features/territory/mapPerformance';
import { useMapPerformance } from '@/features/territory/useMapPerformance';
import { TerritoryFilterBar, TerritoryFilterModal, type TerritoryFilterBarProps } from '@/components/territory/TerritoryFilterBar';
import { TerritoryListView } from '@/components/territory/TerritoryListView';
import { usePublicSources, usePublicFacilities, useNeighborhoods, useNeighborhoodBoundary } from '@/features/territory/usePublicData';
import { chooseTerritorialEntries, computeOverviewRegion, computeRegionBounds, TERRITORY_PERIOD_OPTIONS, TERRITORY_STATUS_OPTIONS } from '@/features/territory/selectors';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { layout } from '@/theme/layout';
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { BackHandler, Platform, Pressable, FlatList, StyleSheet, View, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams, useIsFocused } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeviceLocation } from '@/features/places/useDeviceLocation';
import { useTerritoryFilters } from '@/features/places/useTerritoryFilters';
import { usePlacesStore } from '@/stores/placesStore';
import { mapOverlayContext } from '@/features/territory/mapArea';
import { AppText } from '@/components/ui/AppText';
import { AppToast } from '@/components/ui/AppToast';
import {
  useInfiniteOfficialCalls,
  useOfficialFilters,
} from '@/features/city/useOfficialCalls';
import { spacing } from '@/theme/spacing';
import {
  useTerritoryStore,
  useTerritorySelection,
  useTerritoryViewMode,
  useTerritoryFiltersModal,
  useTerritoryDomain,
} from '@/stores/territoryStore';
import { MapboxMapView, isMapboxAvailable, type MapMarker } from '@/components/ui/MapboxMapView';
import {
  TerritoryPreviewCard,
  entryLocation,
  entryToMarker,
  type Entry,
} from '@/components/territory/TerritoryPreviewCard';
import { TerritoryClusterCarousel } from '@/components/territory/TerritoryClusterCarousel';

type TerritoryMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  zoom?: number;
};

const INITIAL_REGION: TerritoryMapRegion = {
  latitude: -22.92,
  longitude: -43.32,
  latitudeDelta: 0.4,
  longitudeDelta: 0.55,
  zoom: 12,
};

export default function TerritoryScreen() {
  return <TerritoryContent />;
}

export function TerritoryContent() {
  const isFocused = useIsFocused();
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const mapAvailable = isMapboxAvailable();

  const listOffsetRef = useRef(0);
  const listRef = useRef<FlatList<Entry>>(null);
  const restoreListOffsetRef = useRef(true);
  useEffect(() => {
    if (!isFocused) restoreListOffsetRef.current = true;
  }, [isFocused]);

  const {
    neighborhoodId: routeNeighborhoodId, layer: routeLayer,
    startDate, endDate, filters, focusId, lat, lng,
    neighborhood: paramNeighborhood,
  } = useLocalSearchParams<{
    neighborhoodId?: string; layer?: string; startDate?: string; endDate?: string;
    filters?: string; focusId?: string; lat?: string; lng?: string; neighborhood?: string;
  }>();
  const {
    neighborhood,
    neighborhoodId: storedNeighborhoodId,
    setNeighborhood,
  } = useTerritorySelection();
  const neighborhoodId = routeNeighborhoodId || storedNeighborhoodId;
  const layers = useTerritoryStore((s) => s.layers);
  const setLayers = useTerritoryStore((s) => s.setLayers);
  const neighborhoods = useNeighborhoods();
  const boundary = useNeighborhoodBoundary(neighborhoodId);

  const [region, setRegion] = useState<TerritoryMapRegion>(INITIAL_REGION);
  const viewportRef = useRef<TerritoryMapRegion>(INITIAL_REGION);
  const updateCameraRegion = useCallback(
    (
      next:
        | TerritoryMapRegion
        | ((prev: TerritoryMapRegion) => TerritoryMapRegion),
    ) => {
      setRegion((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        viewportRef.current = resolved;
        return resolved;
      });
    },
    [],
  );
  const [areaOnly, setAreaOnly] = useState(false);
  const [appliedBounds, setAppliedBounds] = useState<{
    north: number; south: number; east: number; west: number;
  } | null>(null);
  const activeSelection = usePlacesStore((s) => s.selection);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAreaOnly(false);
    setAppliedBounds(null);
  }, [activeSelection, routeNeighborhoodId, focusId]);

  const territorialFilters = useTerritoryFilters();
  const { serviceType, period, search, status, selection, setFilter } = territorialFilters;
  const setServiceType = useCallback((value: string) => setFilter('serviceType', value), [setFilter]);
  const setPeriod = useCallback((value: string) => setFilter('period', value), [setFilter]);
  const setSearch = useCallback((value: string) => setFilter('search', value), [setFilter]);
  const setStatus = useCallback((value: string) => setFilter('status', value), [setFilter]);
  const debouncedSearch = useDebouncedValue(search, 300);
  const appliedSearch = search.trim() ? debouncedSearch.trim() : '';
  const { isListView, setIsListView } = useTerritoryViewMode();
  const effectiveListView = isListView || !mapAvailable;
  const { territoryDomain, setTerritoryDomain, setFacilityLayers } = useTerritoryDomain();
  const { interactionsComplete, visitTrace } = useMapPerformance(isFocused, effectiveListView);

  const facilityParams = { neighborhoodId, search: appliedSearch || undefined, ...(areaOnly && appliedBounds ? appliedBounds : {}) };
  const facilitiesConfirmed = !neighborhood || Boolean(neighborhoodId);
  const facilityScope = neighborhoodId || neighborhood || 'municipality';
  const schools = usePublicFacilities({ ...facilityParams, categories: ['school'] }, isFocused && interactionsComplete && layers.includes('school') && facilitiesConfirmed, facilityScope);
  const health = usePublicFacilities({ ...facilityParams, categories: ['health'] }, isFocused && interactionsComplete && layers.includes('health') && facilitiesConfirmed, facilityScope);
  const squares = usePublicFacilities({ ...facilityParams, categories: ['square'] }, isFocused && interactionsComplete && layers.includes('square') && facilitiesConfirmed, facilityScope);
  const facilityQueries = useMemo(() => ({ school: schools, health, square: squares }), [schools, health, squares]);
  const sources = usePublicSources(isFocused && interactionsComplete);
  const officialSource = sources.data?.find((s) => s.sourceId === 'rio1746');
  const officialFilters = useOfficialFilters(isFocused && interactionsComplete);
  const officialTime = { startDate, endDate, periodDays: startDate || endDate || period === 'all' ? undefined : Number(period) };
  const officialCalls = useInfiniteOfficialCalls(
    {
      ...(areaOnly && appliedBounds ? appliedBounds : routeNeighborhoodId ? { neighborhoodId: routeNeighborhoodId } : territorialFilters.params),
      tipo: serviceType === 'all' ? undefined : serviceType,
      situacao: status === 'all' ? undefined : status,
      ...officialTime,
      search: appliedSearch || undefined,
      limit: 50,
      hasCoordinates: areaOnly ? true : undefined,
    },
    isFocused && layers.includes('official') && territorialFilters.hydrated,
    mapPerformanceEnabled,
    territorialFilters.cacheScope,
  );

  const bairroOptions = useMemo(
    () => neighborhoods.data?.map((x) => x.name) || officialFilters.data?.bairros || [],
    [neighborhoods.data, officialFilters.data?.bairros],
  );

  const serviceTypeOptions = useMemo(() => {
    const allTypes = officialFilters.data?.tipos || [];
    return [
      { value: 'all', label: 'Todos os serviços' },
      ...allTypes.map((t) => ({ value: t, label: t })),
    ];
  }, [officialFilters.data?.tipos]);

  const { filtersOpen, setFiltersOpen } = useTerritoryFiltersModal();
  useEffect(() => {
    if (filters) setFiltersOpen(true);
  }, [filters, setFiltersOpen]);

  useEffect(() => {
    if (!routeNeighborhoodId && !routeLayer) return;
    const target = neighborhoods.data?.find((n) => n.id === routeNeighborhoodId);
    if (target) setNeighborhood(target.name);
    setStatus('Não Encerrado');
    setServiceType('all');
    setSearch('');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAreaOnly(false);
    setAppliedBounds(null);
    if (routeLayer === 'official') setTerritoryDomain('calls');
    else if (['school', 'health', 'square'].includes(routeLayer || '')) {
      setTerritoryDomain('facilities');
      setFacilityLayers([routeLayer as 'school']);
    }
  }, [
    routeNeighborhoodId, routeLayer, neighborhoods.data, setNeighborhood,
    setLayers, setSearch, setServiceType, setStatus, setTerritoryDomain, setFacilityLayers,
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<{
    ids: string[]; latitude: number; longitude: number;
  } | null>(null);
  const { captureLocation, busy: locating, error: locationError } = useDeviceLocation();
  const capturedLocation = usePlacesStore((s) => s.deviceLocation);
  const mapOverlay = useMemo(() => mapOverlayContext(selection, capturedLocation, areaOnly || Boolean(routeNeighborhoodId)),
    [selection, capturedLocation, areaOnly, routeNeighborhoodId]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (locationError) setToastMessage(locationError);
  }, [locationError]);

  useEffect(() => {
    if (!isFocused || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedId !== null || selectedCluster !== null) {
        setSelectedId(null);
        setSelectedCluster(null);
        return true;
      }
      if (isListView && mapAvailable) {
        setIsListView(false);
        return true;
      }
      if (areaOnly) {
        setAreaOnly(false);
        setAppliedBounds(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isFocused, selectedId, selectedCluster, isListView, mapAvailable, areaOnly, setIsListView]);

  useEffect(() => {
    if (!focusId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId(focusId);
    setSelectedCluster(null);
    setIsListView(false);
    setAreaOnly(false);
    setStatus('all');
    setServiceType('all');
    setSearch('');
    if (paramNeighborhood) setNeighborhood(paramNeighborhood);

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
      updateCameraRegion((prev) => ({
        ...prev,
        latitude: targetLat,
        longitude: targetLng,
        zoom: 17,
      }));
    }
  }, [
    focusId, lat, lng, paramNeighborhood, officialCalls.data?.calls,
    setIsListView, setNeighborhood, updateCameraRegion, setSearch, setServiceType, setStatus,
  ]);

  const entries = useMemo<Entry[]>(() => {
    const calls = officialCalls.data?.calls || [];
    const facilities = [schools.data, health.data, squares.data].flatMap(
      (data) => data?.pages.flatMap((p) => p.items) || [],
    );
    return chooseTerritorialEntries(calls, facilities, layers, {
      neighborhood,
      neighborhoodId,
    });
  }, [
    officialCalls.data?.calls, schools.data, health.data, squares.data,
    layers, neighborhood, neighborhoodId,
  ]);

  const unlocated = useMemo(() => entries.filter((entry) => !entryLocation(entry)), [entries]);
  const located = useMemo(() => entries.filter((entry) => Boolean(entryLocation(entry))), [entries]);
  const listed = areaOnly ? located : entries;

  const selectedEntry = useMemo<Entry | null>(() => {
    if (!selectedId) return null;
    const fromEntries = entries.find((entry) => entry.item.id === selectedId);
    if (fromEntries) return fromEntries;
    const off = officialCalls.data?.calls?.find((item) => item.id === selectedId);
    return off ? { type: 'official' as const, item: off } : null;
  }, [selectedId, entries, officialCalls.data?.calls]);

  const selectedClusterEntries = useMemo<Entry[]>(() => {
    if (!selectedCluster || selectedCluster.ids.length === 0) return [];
    const idSet = new Set(selectedCluster.ids);
    return entries.filter((entry) => idSet.has(entry.item.id));
  }, [selectedCluster, entries]);

  const municipalOverviewRegion = useMemo(() => {
    const points = entries
      .map((entry) => entryLocation(entry))
      .filter((pt): pt is { latitude: number; longitude: number } => Boolean(pt));
    const calculated = computeOverviewRegion(points, INITIAL_REGION);
    return { ...calculated, zoom: calculated.zoom ?? 12 };
  }, [entries]);

  const filterCount =
    Number(Boolean(neighborhood)) +
    Number(status !== 'all') +
    Number(serviceType !== 'all') +
    Number(period !== 'all') + Number(selection.kind === 'radius') +
    Number(areaOnly);

  const totalCalls = officialCalls.data?.total ?? listed.length;
  const hasMoreCalls = Boolean(officialCalls.hasNextPage);
  const dataReady = officialCalls.data !== undefined;

  const lastFittedNeighborhoodRef = useRef<string | null>(null);
  useEffect(() => {
    if (!neighborhood || areaOnly || focusId || activeSelection.kind === 'radius') return;
    if (lastFittedNeighborhoodRef.current === neighborhood) return;
    if (entries.some((entry) => Boolean(entryLocation(entry)))) {
      lastFittedNeighborhoodRef.current = neighborhood;
      updateCameraRegion(municipalOverviewRegion);
    }
  }, [neighborhood, areaOnly, focusId, entries, municipalOverviewRegion, activeSelection.kind, updateCameraRegion]);

  const openEntry = useCallback((entry: Entry) => {
    router.push({
      pathname: entry.type === 'facility' ? '/FacilityDetailsScreen' : '/OfficialCallDetailsScreen',
      params: { id: entry.item.id },
    });
  }, []);

  const handleLocateEntry = useCallback(
    (entry: Entry) => {
      if (!mapAvailable) return;
      const point = entryLocation(entry);
      setSelectedId(entry.item.id);
      setSelectedCluster(null);
      setIsListView(false);
      if (point) {
        updateCameraRegion((prev) => ({
          ...prev,
          latitude: point.latitude,
          longitude: point.longitude,
          zoom: 16.5,
        }));
      }
    },
    [mapAvailable, setIsListView, updateCameraRegion],
  );

  const mapMarkers: MapMarker[] = useMemo(() => {
    return located.map(entryToMarker).filter((m): m is MapMarker => m !== null);
  }, [located]);

  const allMapMarkers = useMemo(() => {
    if (!selectedEntry || mapMarkers.some((m) => m.id === selectedEntry.item.id)) {
      return mapMarkers;
    }
    const extra = entryToMarker(selectedEntry);
    return extra ? [...mapMarkers, extra] : mapMarkers;
  }, [mapMarkers, selectedEntry]);

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedId(id);
    setSelectedCluster(null);
  }, []);

  const handleClusterClick = useCallback(
    (event: { ids: string[]; count: number; latitude: number; longitude: number }) => {
      setSelectedCluster(event);
      setSelectedId(null);
    },
    [],
  );

  const handleMapClick = useCallback(() => {
    setSelectedId(null);
    setSelectedCluster(null);
  }, []);

  const handleRegionChange = useCallback(
    (newRegion: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number; zoom?: number }) => {
      viewportRef.current = {
        ...viewportRef.current,
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
        latitudeDelta: newRegion.latitudeDelta,
        longitudeDelta: newRegion.longitudeDelta,
        zoom: newRegion.zoom ?? viewportRef.current.zoom,
      };
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setSearch('');
    setServiceType('all');
    setPeriod('all');
    router.setParams({ neighborhoodId: undefined, layer: undefined, startDate: undefined, endDate: undefined });
    setSelectedId(null);
    setSelectedCluster(null);
    setStatus('Não Encerrado');
    setNeighborhood('');
    setAreaOnly(false);
    setAppliedBounds(null);
  }, [setNeighborhood, setSearch, setServiceType, setPeriod, setStatus]);

  const locate = async () => {
    if (capturedLocation && Number.isFinite(capturedLocation.latitude)) {
      updateCameraRegion({
        latitude: capturedLocation.latitude,
        longitude: capturedLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
        zoom: 15.5,
      });
    } else if (selection.kind === 'radius' && Number.isFinite(selection.latitude)) {
      updateCameraRegion({
        latitude: selection.latitude,
        longitude: selection.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
        zoom: 15.5,
      });
    }
    const location = await captureLocation();
    if (location) {
      router.setParams({ neighborhoodId: undefined, layer: undefined, lat: undefined, lng: undefined, focusId: undefined });
      setAreaOnly(false);
      setAppliedBounds(null);
      setSelectedId(null);
      setSelectedCluster(null);
      updateCameraRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
        zoom: 15.5,
      });
    }
  };

  const [refreshing, setRefreshing] = useState(false);
  const refreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        ...(layers.includes('official') ? [officialCalls.refetch()] : []),
        ...(neighborhoodId ? [boundary.refetch()] : []),
        ...Object.entries(facilityQueries)
          .filter(([k]) => facilitiesConfirmed && layers.includes(k as 'school'))
          .map(([, q]) => q.refetch()),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId(null);
    setSelectedCluster(null);
    listOffsetRef.current = 0;
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [neighborhoodId, neighborhood, layers, search, status, serviceType, period]);

  const handleNeighborhoodChange = useCallback((value: string) => {
    setNeighborhood(value);
    router.setParams({ neighborhoodId: undefined, layer: undefined });
    setAreaOnly(false);
    setAppliedBounds(null);
    setSelectedId(null);
    setSelectedCluster(null);
  }, [setNeighborhood]);

  const handleClearAreaOnly = useCallback(() => {
    setAreaOnly(false);
    setAppliedBounds(null);
  }, []);

  const filterBarProps: TerritoryFilterBarProps = useMemo(() => ({
    radiusMeters: !areaOnly && !routeNeighborhoodId && selection.kind === 'radius' ? selection.radiusMeters : undefined,
    onRadiusChange: (value) => { void usePlacesStore.getState().setRadius(value); },
    radiusLabel: !areaOnly && !routeNeighborhoodId && selection.kind === 'radius' ? layers.some((layer) => layer !== 'official') ? 'Raio só no 1746' : 'Entorno 1746' : undefined,
    areaOnly,
    onClearAreaOnly: handleClearAreaOnly,
    mapAvailable,
    search,
    onSearchChange: setSearch,
    onOpenFilters: () => setFiltersOpen(true),
    filtersOpen,
    filterCount,
    bairroOptions,
    neighborhood,
    neighborhoodId,
    onNeighborhoodChange: handleNeighborhoodChange,
    serviceType,
    serviceTypeOptions,
    onServiceTypeChange: (value) => { setServiceType(value); setSelectedId(null); setSelectedCluster(null); },
    period,
    periodOptions: TERRITORY_PERIOD_OPTIONS,
    onPeriodChange: (value) => {
      setPeriod(value);
      router.setParams({ startDate: undefined, endDate: undefined });
      setSelectedId(null);
      setSelectedCluster(null);
    },
    status,
    statusOptions: TERRITORY_STATUS_OPTIONS,
    onStatusChange: (value) => { setStatus(value); setSelectedId(null); setSelectedCluster(null); },
    layers,
    onLayersChange: setLayers,
    startDate,
    endDate,
    totalCalls,
    officialCallsStatus: {
      isLoading: officialCalls.isLoading,
      error: officialCalls.error,
      displayedCount: officialCalls.data?.calls.length || 0,
      total: officialCalls.data?.total ?? null,
      territoryConfirmed: officialCalls.data?.territoryConfirmed,
      sourceState: officialSource?.state,
    },
    facilityQueries,
    facilitiesConfirmed,
  }), [
    selection, areaOnly, handleClearAreaOnly, mapAvailable, routeNeighborhoodId,
    setSearch, setServiceType, setPeriod, setStatus, search, setFiltersOpen, filtersOpen,
    filterCount, bairroOptions, neighborhood, neighborhoodId, handleNeighborhoodChange,
    serviceType, serviceTypeOptions, period, status, layers, setLayers, startDate, endDate,
    totalCalls, officialCalls.isLoading, officialCalls.error, officialCalls.data?.calls.length,
    officialCalls.data?.total, officialCalls.data?.territoryConfirmed, officialSource?.state,
    facilityQueries, facilitiesConfirmed,
  ]);

  const summaryLabel =
    territoryDomain === 'facilities'
      ? `Ver lista de equipamentos (${listed.length.toLocaleString('pt-BR')})`
      : officialCalls.isLoading
        ? 'Consultando chamados neste recorte...'
        : `Ver em lista · ${totalCalls.toLocaleString('pt-BR')} ${totalCalls === 1 ? 'chamado' : 'chamados'}`;

  const summarySubLabel =
    territoryDomain === 'calls' && unlocated.length > 0
      ? `+${unlocated.length} sem ponto no mapa · Toque para abrir a lista`
      : 'Toque em um ponto no mapa ou abra a lista completa';

  return (
    <View style={[styles.container, !isFocused && mapPerformanceVariant !== 'visible-surface' && { display: 'none' }]}>
      <AppToast
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
        topOffset={insets.top + 130}
        type={locationError ? 'warning' : 'info'}
      />

      {mapAvailable && (
        <View style={StyleSheet.absoluteFill}>
          <MapboxMapView
            style={StyleSheet.absoluteFill}
            region={region}
            markers={allMapMarkers}
            boundary={boundary.data?.geometry}
            searchArea={mapOverlay.searchArea}
            deviceLocation={mapOverlay.deviceLocation}
            fitSearchArea={!focusId}
            selectedId={selectedId}
            selectedClusterIds={selectedCluster?.ids || null}
            isDark={mode === 'dark'}
            performanceDiagnostics={mapPerformanceEnabled}
            diagnosticTrace={visitTrace}
            onMarkerClick={handleMarkerClick}
            onClusterClick={handleClusterClick}
            onMapClick={handleMapClick}
            onRegionChange={handleRegionChange}
          />

          {officialCalls.isLoading && (
            <View style={[styles.loadingPill, { top: insets.top + 148 }]}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <AppText variant="caption" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                Carregando chamados...
              </AppText>
            </View>
          )}
        </View>
      )}

      {mapAvailable && (
        <View style={[styles.topFloatingHeader, { paddingTop: insets.top + spacing.xs }]}>
          <TerritoryFilterBar {...filterBarProps} />
        </View>
      )}

      {!effectiveListView && !selectedEntry && selectedClusterEntries.length === 0 && (
        <View style={[styles.bottomFloatingContainer, { bottom: insets.bottom + 90 }]}>
          {/* Linha de controles espaciais do mapa */}
          <View style={styles.mapActionsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Minha posição"
              accessibilityState={{ disabled: locating, busy: locating }}
              disabled={locating}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                void locate();
              }}
              style={({ pressed }) => [
                styles.dockCircleButton,
                { backgroundColor: colors.surface },
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons
                name="locate"
                size={20}
                color={locating ? colors.accent : colors.ink}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={areaOnly ? 'Voltar ao recorte selecionado' : 'Buscar nesta área'}
              style={({ pressed }) => [
                styles.areaPillButton,
                { backgroundColor: colors.surface },
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (areaOnly) {
                  setAreaOnly(false);
                  setAppliedBounds(null);
                } else {
                  setAppliedBounds(computeRegionBounds(viewportRef.current));
                  setAreaOnly(true);
                }
              }}
            >
              <Ionicons
                name={areaOnly ? 'globe-outline' : 'scan-outline'}
                size={16}
                color={colors.ink}
              />
              <AppText variant="caption" style={{ fontWeight: '700' }}>
                {areaOnly ? 'Voltar ao recorte' : 'Buscar nesta área'}
              </AppText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enquadrar recorte"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateCameraRegion(municipalOverviewRegion);
                setAreaOnly(false);
                setSelectedId(null);
                setSelectedCluster(null);
              }}
              style={({ pressed }) => [
                styles.dockCircleButton,
                { backgroundColor: colors.surface },
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="expand-outline" size={20} color={colors.ink} />
            </Pressable>
          </View>

          {/* Barra Contextual de Resultados e Acesso à Lista */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${summaryLabel}. ${summarySubLabel}`}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsListView(true);
            }}
            style={({ pressed }) => [
              styles.summaryBarButton,
              { backgroundColor: colors.surface },
              pressed && styles.buttonPressed,
            ]}
          >
            <View style={[styles.summaryIconCircle, { backgroundColor: colors.surfaceSubdued }]}>
              <Ionicons name="list-outline" size={18} color={colors.onSurfaceBrand} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText variant="label" numberOfLines={1} style={styles.summaryTitle}>
                {summaryLabel}
              </AppText>
              <AppText variant="caption" color="muted" numberOfLines={1} style={styles.summarySubtitle}>
                {summarySubLabel}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        </View>
      )}

      {!effectiveListView && selectedClusterEntries.length > 1 && (
        <TerritoryClusterCarousel
          entries={selectedClusterEntries}
          onOpen={openEntry}
          onClose={() => setSelectedCluster(null)}
          onZoomCluster={() => {
            if (selectedCluster) {
              const targetLat = selectedCluster.latitude;
              const targetLng = selectedCluster.longitude;
              setSelectedCluster(null);
              updateCameraRegion((curr) => ({
                ...curr,
                latitude: targetLat,
                longitude: targetLng,
                zoom: Math.max(16, Math.min(18, (curr.zoom ?? 14) + 2)),
              }));
            }
          }}
          bottomOffset={insets.bottom + 92}
        />
      )}

      {!effectiveListView && selectedClusterEntries.length === 1 && (
        <TerritoryPreviewCard
          entry={selectedClusterEntries[0]}
          onOpen={openEntry}
          onClose={() => setSelectedCluster(null)}
          bottomOffset={insets.bottom + 92}
        />
      )}

      {!effectiveListView && selectedClusterEntries.length === 0 && selectedEntry && (
        <TerritoryPreviewCard
          entry={selectedEntry}
          onOpen={openEntry}
          onClose={() => setSelectedId(null)}
          bottomOffset={insets.bottom + 92}
        />
      )}

      {effectiveListView && (
        <TerritoryListView
          visible={effectiveListView && isFocused}
          asSheet={mapAvailable}
          onClose={() => setIsListView(false)}
          listRef={listRef}
          listOffsetRef={listOffsetRef}
          restoreListOffsetRef={restoreListOffsetRef}
          listed={listed}
          unlocatedCount={unlocated.length}
          areaOnly={areaOnly}
          layers={layers}
          totalCalls={totalCalls}
          hasMoreCalls={hasMoreCalls}
          dataReady={dataReady}
          refreshing={refreshing}
          onRefresh={() => { void refreshAll(); }}
          onOpenEntry={openEntry}
          onLocateEntry={mapAvailable ? handleLocateEntry : undefined}
          onResetFilters={resetFilters}
          officialQuery={{
            isLoading: officialCalls.isLoading, isFetching: officialCalls.isFetching,
            isFetchingNextPage: officialCalls.isFetchingNextPage, error: officialCalls.error,
            fetchStatus: officialCalls.fetchStatus, refetch: () => { void officialCalls.refetch(); },
            fetchNextPage: () => { void officialCalls.fetchNextPage(); },
          }}
          filterBarProps={filterBarProps}
        />
      )}

      <TerritoryFilterModal
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onReset={resetFilters}
        bairroOptions={bairroOptions}
        neighborhood={neighborhood}
        onNeighborhoodChange={handleNeighborhoodChange}
        serviceType={serviceType}
        serviceTypeOptions={serviceTypeOptions}
        onServiceTypeChange={(value) => { setServiceType(value); setSelectedId(null); }}
        status={status}
        onStatusChange={(value) => { setStatus(value); setSelectedId(null); }}
        period={period}
        periodOptions={TERRITORY_PERIOD_OPTIONS}
        onPeriodChange={(value) => { setPeriod(value); router.setParams({ startDate: undefined, endDate: undefined }); setSelectedId(null); }}
        areaOnly={areaOnly}
        onAreaOnlyChange={(nextArea) => { setAreaOnly(nextArea); setAppliedBounds(nextArea ? computeRegionBounds(viewportRef.current) : null); setSelectedId(null); }}
        totalCalls={totalCalls}
        radiusMeters={!areaOnly && !routeNeighborhoodId && selection.kind === 'radius' ? selection.radiusMeters : undefined}
        onRadiusChange={(value) => { void usePlacesStore.getState().setRadius(value); }}
        radiusLabel={!areaOnly && !routeNeighborhoodId && selection.kind === 'radius' ? layers.some((layer) => layer !== 'official') ? 'Raio só no 1746' : 'Entorno 1746' : undefined}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.canvas },
    loadingPill: {
      position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center',
      gap: 8, backgroundColor: 'rgba(15, 23, 42, 0.85)', paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: layout.radius.pill, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, zIndex: 40,
    },
    topFloatingHeader: {
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, paddingHorizontal: spacing.md, gap: 8,
    },
    bottomFloatingContainer: {
      position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 40, gap: 8,
    },
    mapActionsRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    dockCircleButton: {
      width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 6,
      elevation: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    },
    areaPillButton: {
      flexDirection: 'row', alignItems: 'center', gap: 6, height: 42, paddingHorizontal: spacing.md,
      borderRadius: layout.radius.pill, shadowColor: '#000000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14, shadowRadius: 8, elevation: 5, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    },
    summaryBarButton: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm + 4,
      paddingVertical: 10, borderRadius: layout.radius.card, borderWidth: 1, borderColor: colors.border,
      shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
    },
    summaryIconCircle: {
      width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    },
    summaryTitle: { fontSize: 13, fontWeight: '700' },
    summarySubtitle: { fontSize: 11 },
    buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  });
