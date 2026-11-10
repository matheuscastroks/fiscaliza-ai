






import { type TerritoryFilterBarProps } from '@/components/territory/TerritoryFilterBar';







import { chooseTerritorialEntries, computeOverviewRegion, TERRITORY_PERIOD_OPTIONS, TERRITORY_STATUS_OPTIONS } from '@/features/territory/selectors';





import { summarizeFacilityPagination } from '@/features/territory/facilityPagination';







import { useMemo, useState, useEffect, useRef, useCallback } from 'react';






import * as Haptics from 'expo-haptics';





import { router } from 'expo-router';











import { usePlacesStore } from '@/stores/placesStore';











import { type MapMarker } from '@/components/ui/MapboxMapView';





import { entryLocation, entryToMarker, type Entry } from '@/components/territory/TerritoryPreviewCard';




import { OPEN_STATUS } from '@/features/city/callStatus';






type TerritoryMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  zoom?: number;
};

import { INITIAL_REGION, type useTerritoryQueries } from './useTerritoryQueries';




type TerritoryQueries = ReturnType<typeof useTerritoryQueries>;

/** Entradas derivadas, seleção, câmera e callbacks de interação do mapa/lista. */
export function useTerritoryView(q: TerritoryQueries) {
  const {
    mapAvailable,
    listOffsetRef,
    listRef,
    routeNeighborhoodId,
    startDate,
    endDate,
    focusId,
    lat,
    lng,
    neighborhood,
    setNeighborhood,
    neighborhoodId,
    layers,
    setLayers,
    boundary,
    viewportRef,
    updateCameraRegion,
    areaOnly,
    setAreaOnly,
    setAppliedBounds,
    setHasMovedCamera,
    activeSelection,
    serviceType,
    macroTheme,
    period,
    search,
    status,
    selection,
    setServiceType,
    setMacroTheme,
    setPeriod,
    setSearch,
    setStatus,
    setIsListView,
    territoryDomain,
    facilitiesConfirmed,
    schools,
    health,
    squares,
    facilityQueries,
    officialSource,
    officialCalls,
    bairroOptions,
    serviceTypeOptions,
    filtersOpen,
    setFiltersOpen,
    selectedId,
    setSelectedId,
    selectedCluster,
    setSelectedCluster,
    captureLocation,
    capturedLocation,
    focusedCallQuery,
  } = q;
  const entries = useMemo<Entry[]>(() => {
    const calls = officialCalls.data?.calls || [];
    const facilities = [schools.data, health.data, squares.data].flatMap(
      (data) => data?.pages.flatMap((p) => p.items) || [],
    );
    return chooseTerritorialEntries(calls, facilities, layers, {
      neighborhood: areaOnly ? undefined : neighborhood,
      neighborhoodId: areaOnly ? undefined : neighborhoodId,
    });
  }, [
    officialCalls.data?.calls, schools.data, health.data, squares.data,
    layers, neighborhood, neighborhoodId, areaOnly,
  ]);

  const unlocated = useMemo(() => entries.filter((entry) => !entryLocation(entry)), [entries]);
  const located = useMemo(() => entries.filter((entry) => Boolean(entryLocation(entry))), [entries]);
  const listed = areaOnly ? located : entries;

  const selectedEntry = useMemo<Entry | null>(() => {
    if (!selectedId) return null;
    const fromEntries = entries.find((entry) => entry.item.id === selectedId);
    if (fromEntries) return fromEntries;
    const off = officialCalls.data?.calls?.find((item) => item.id === selectedId);
    if (off) return { type: 'official' as const, item: off };
    if (
      focusedCallQuery.data &&
      (focusedCallQuery.data.id === selectedId ||
        focusedCallQuery.data.externalId === selectedId)
    ) {
      return { type: 'official' as const, item: focusedCallQuery.data };
    }
    return null;
  }, [selectedId, entries, officialCalls.data?.calls, focusedCallQuery.data]);

  const activeFacilityQueries = useMemo(() => {
    const labels = { school: 'escolas', health: 'serviços de saúde', square: 'praças' } as const;
    return (['school', 'health', 'square'] as const)
      .filter((cat) => layers.includes(cat))
      .map((cat) => {
        const query = facilityQueries[cat];
        return {
          category: cat,
          query,
          label: labels[cat],
          loaded: query.data?.pages.flatMap((p) => p.items).length ?? 0,
          total: query.data?.pages[0]?.total ?? null,
          hasNextPage: Boolean(query.hasNextPage),
          isFetchingNextPage: Boolean(query.isFetchingNextPage),
          fetchNextPage: () => { void query.fetchNextPage(); },
        };
      });
  }, [layers, facilityQueries]);

  const facilityPagination = useMemo(
    () => summarizeFacilityPagination(activeFacilityQueries),
    [activeFacilityQueries],
  );
  const totalFacilitiesKnown = facilityPagination?.totalKnown ?? null;

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
    Number(macroTheme !== 'all') +
    Number(period !== 'all') + Number(selection.kind === 'radius') +
    Number(areaOnly);

  const totalCalls = officialCalls.data?.total ?? listed.length;
  const hasMoreCalls = Boolean(officialCalls.hasNextPage);
  const dataReady = layers.includes('official')
    ? officialCalls.data !== undefined
    : activeFacilityQueries.length > 0 &&
      activeFacilityQueries.every(
        (query) => query.query.data !== undefined || query.query.isError,
      );

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
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    if (focusId) router.setParams({ focusId: undefined });
  }, [focusId]);

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
      setHasMovedCamera(true);
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setSearch('');
    setMacroTheme('all');
    setServiceType('all');
    setPeriod('all');
    router.setParams({ neighborhoodId: undefined, layer: undefined, startDate: undefined, endDate: undefined });
    setSelectedId(null);
    setSelectedCluster(null);
    setStatus(OPEN_STATUS);
    setNeighborhood('');
    setAreaOnly(false);
    setAppliedBounds(null);
    setHasMovedCamera(false);
  }, [setNeighborhood, setSearch, setMacroTheme, setServiceType, setPeriod, setStatus]);

  const locate = async () => {
    setHasMovedCamera(false);
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
          .filter(([k]) => facilitiesConfirmed && (layers as string[]).includes(k))
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
  }, [neighborhoodId, neighborhood, layers, search, status, macroTheme, serviceType, period]);

  const handleNeighborhoodChange = useCallback((value: string) => {
    setNeighborhood(value);
    router.setParams({ neighborhoodId: undefined, layer: undefined });
    setAreaOnly(false);
    setAppliedBounds(null);
    setSelectedId(null);
    setSelectedCluster(null);
    setHasMovedCamera(false);
  }, [setNeighborhood]);

  const handleClearAreaOnly = useCallback(() => {
    setAreaOnly(false);
    setAppliedBounds(null);
    setHasMovedCamera(false);
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
      setPeriod(value); router.setParams({ startDate: undefined, endDate: undefined });
      setSelectedId(null); setSelectedCluster(null);
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
      isLoading: officialCalls.isLoading, error: officialCalls.error,
      displayedCount: officialCalls.data?.calls.length || 0,
      total: officialCalls.data?.total ?? null,
      territoryConfirmed: officialCalls.data?.territoryConfirmed,
      sourceState: officialSource?.state,
    },
    facilityQueries, facilitiesConfirmed,
    macroTheme,
    onMacroThemeChange: (value: string) => { setMacroTheme(value); setSelectedId(null); setSelectedCluster(null); },
    onResetFilters: resetFilters,
  }), [
    selection, areaOnly, handleClearAreaOnly, mapAvailable, routeNeighborhoodId,
    setSearch, setServiceType, setPeriod, setStatus, search, setFiltersOpen, filtersOpen,
    filterCount, bairroOptions, neighborhood, neighborhoodId, handleNeighborhoodChange,
    serviceType, serviceTypeOptions, period, status, layers, setLayers, startDate, endDate,
    totalCalls, officialCalls.isLoading, officialCalls.error, officialCalls.data?.calls.length,
    officialCalls.data?.total, officialCalls.data?.territoryConfirmed, officialSource?.state,
    facilityQueries, facilitiesConfirmed, macroTheme, setMacroTheme, resetFilters,
  ]);

  const waitingForLocation = activeSelection.kind === 'pending-current';

  const summaryLabel =
    territoryDomain === 'facilities'
      ? totalFacilitiesKnown !== null && listed.length < totalFacilitiesKnown
        ? `Ver lista de equipamentos (${listed.length.toLocaleString('pt-BR')} de ${totalFacilitiesKnown.toLocaleString('pt-BR')})`
        : `Ver lista de equipamentos (${listed.length.toLocaleString('pt-BR')})`
      : activeSelection.kind === 'pending-current'
        ? 'Aguardando sua localização'
        : officialCalls.isLoading
        ? 'Consultando chamados neste recorte...'
        : officialCalls.error && listed.length === 0
          ? 'Não foi possível carregar os chamados'
          : `Ver em lista · ${totalCalls.toLocaleString('pt-BR')} ${totalCalls === 1 ? 'chamado' : 'chamados'}`;

  const summarySubLabel =
    territoryDomain === 'calls' && activeSelection.kind === 'pending-current'
      ? 'Toque em localizar ou escolha um bairro no seletor acima'
      : territoryDomain === 'calls' && officialCalls.error && listed.length === 0
      ? 'Verifique a conexão. Toque para ver o motivo e tentar de novo'
      : territoryDomain === 'calls' && unlocated.length > 0
      ? `+${unlocated.length} sem ponto no mapa · Toque para abrir a lista`
      : 'Toque em um ponto no mapa ou abra a lista completa';

  return {
    unlocated,
    listed,
    selectedEntry,
    facilityPagination,
    selectedClusterEntries,
    municipalOverviewRegion,
    totalCalls,
    hasMoreCalls,
    dataReady,
    openEntry,
    handleLocateEntry,
    allMapMarkers,
    handleMarkerClick,
    handleClusterClick,
    handleMapClick,
    handleRegionChange,
    resetFilters,
    locate,
    refreshing,
    refreshAll,
    filterBarProps,
    waitingForLocation,
    summaryLabel,
    summarySubLabel,
  };
}
