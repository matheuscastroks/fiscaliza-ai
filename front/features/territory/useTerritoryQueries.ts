import { useSpatialCalls } from './useSpatialCalls';

import type { CameraBounds } from './useMapCamera';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';


import { mapPerformanceEnabled } from '@/features/territory/mapPerformance';


import { useMapPerformance } from '@/features/territory/useMapPerformance';




import { usePublicSources, usePublicFacilities, useNeighborhoods, useNeighborhoodBoundary } from '@/features/territory/usePublicData';






import { useTheme } from '@/theme/useTheme';


import { useMemo, useState, useEffect, useRef, useCallback } from 'react';


import { BackHandler, Platform, FlatList } from 'react-native';



import { router, useLocalSearchParams, useIsFocused, useFocusEffect } from 'expo-router';


import { useSafeAreaInsets } from 'react-native-safe-area-context';


import { useDeviceLocation } from '@/features/places/useDeviceLocation';


import { useTerritoryFilters } from '@/features/places/useTerritoryFilters';


import { usePlacesStore } from '@/stores/placesStore';


import { mapOverlayContext } from '@/features/territory/mapArea';


import { useInfiniteOfficialCalls, useOfficialCall, useOfficialFilters } from '@/features/city/useOfficialCalls';


import { useTerritoryStore, useTerritorySelection, useTerritoryViewMode, useTerritoryFiltersModal, useTerritoryDomain } from '@/stores/territoryStore';


import { isMapboxAvailable } from '@/components/ui/MapboxMapView';


import { type Entry } from '@/components/territory/TerritoryPreviewCard';

import { OPEN_STATUS } from '@/features/city/callStatus';



type TerritoryMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  zoom?: number;
  bounds?: CameraBounds;
};

export const INITIAL_REGION: TerritoryMapRegion = {
  latitude: -22.92,
  longitude: -43.32,
  latitudeDelta: 0.4,
  longitudeDelta: 0.55,
  zoom: 12,
};


/** Estado, efeitos e callbacks do Explorar; a tela só compõe a interface. */

/** Estado do recorte, filtros e consultas do Explorar (sem interação de mapa). */
export function useTerritoryQueries() {
  const isFocused = useIsFocused();
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
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
    neighborhood: paramNeighborhood, lookup, lookupRequest,
  } = useLocalSearchParams<{
    neighborhoodId?: string; layer?: string; startDate?: string; endDate?: string;
    filters?: string; focusId?: string; lat?: string; lng?: string; neighborhood?: string;
    lookup?: string; lookupRequest?: string;
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
  const [hasMovedCamera, setHasMovedCamera] = useState(false);
  const activeSelection = usePlacesStore((s) => s.selection);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAreaOnly(false);
    setAppliedBounds(null);
    setHasMovedCamera(false);
  }, [activeSelection, routeNeighborhoodId, focusId]);

  const territorialFilters = useTerritoryFilters();
  const { serviceType, macroTheme, period, search, status, selection, setFilter } = territorialFilters;
  const setServiceType = useCallback((value: string) => setFilter('serviceType', value), [setFilter]);
  const setMacroTheme = useCallback((value: string) => setFilter('macroTheme', value), [setFilter]);
  const setPeriod = useCallback((value: string) => setFilter('period', value), [setFilter]);
  const setSearch = useCallback((value: string) => setFilter('search', value), [setFilter]);
  const setStatus = useCallback((value: string) => setFilter('status', value), [setFilter]);
  const debouncedSearch = useDebouncedValue(search, 300);
  const appliedSearch = search.trim() ? debouncedSearch.trim() : '';
  const { isListView, setIsListView } = useTerritoryViewMode();
  const effectiveListView = isListView || !mapAvailable;
  const { territoryDomain, setTerritoryDomain, setFacilityLayers } = useTerritoryDomain();
  const { interactionsComplete, visitTrace } = useMapPerformance(isFocused, effectiveListView);

  const facilityParams = {
    search: appliedSearch || undefined,
    ...(areaOnly && appliedBounds ? appliedBounds : { neighborhoodId }),
  };
  const facilitiesConfirmed = areaOnly || !neighborhood || Boolean(neighborhoodId);
  const facilityScope = areaOnly
    ? 'area'
    : neighborhoodId || neighborhood || 'municipality';
  const schools = usePublicFacilities({ ...facilityParams, categories: ['school'] }, isFocused && interactionsComplete && layers.includes('school') && facilitiesConfirmed, facilityScope);
  const health = usePublicFacilities({ ...facilityParams, categories: ['health'] }, isFocused && interactionsComplete && layers.includes('health') && facilitiesConfirmed, facilityScope);
  const squares = usePublicFacilities({ ...facilityParams, categories: ['square'] }, isFocused && interactionsComplete && layers.includes('square') && facilitiesConfirmed, facilityScope);
  const facilityQueries = useMemo(() => ({ school: schools, health, square: squares }), [schools, health, squares]);
  const sources = usePublicSources(isFocused && interactionsComplete);
  const officialSource = sources.data?.find((s) => s.sourceId === 'rio1746');
  const officialFilters = useOfficialFilters(isFocused && interactionsComplete);
  const officialTime = { startDate, endDate, periodDays: startDate || endDate || period === 'all' ? undefined : Number(period) };
  const officialParams = {
      ...(areaOnly && appliedBounds ? appliedBounds : routeNeighborhoodId ? { neighborhoodId: routeNeighborhoodId } : territorialFilters.params),
      tipo: serviceType === 'all' ? undefined : serviceType,
      tema: macroTheme === 'all' ? undefined : macroTheme,
      situacao: status === 'all' ? undefined : status,
      ...officialTime,
      search: appliedSearch || undefined,
    };
  const { spatialMap, setSpatialViewport } = useSpatialCalls(officialParams,
    isFocused && mapAvailable && layers.includes('official') && territorialFilters.hydrated,
    territorialFilters.cacheScope, INITIAL_REGION);
  const officialCalls = useInfiniteOfficialCalls(
    { ...officialParams, limit: 50, hasCoordinates: areaOnly ? true : undefined },
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

  // Parâmetros de rota são aplicados uma única vez; refetch de bairros não reinicia filtros.
  const appliedRouteKey = useRef<string | null>(null);
  useEffect(() => {
    if (!routeNeighborhoodId && !routeLayer) return;
    const routeKey = `${routeNeighborhoodId ?? ''}|${routeLayer ?? ''}`;
    if (appliedRouteKey.current === routeKey) return;
    const target = neighborhoods.data?.find((n) => n.id === routeNeighborhoodId);
    // Com bairro na rota, espera a lista carregar para resolver o nome.
    if (routeNeighborhoodId && !neighborhoods.data) return;
    appliedRouteKey.current = routeKey;
    if (target) setNeighborhood(target.name);
    setStatus(OPEN_STATUS);
    setMacroTheme('all');
    setServiceType('all');
    setSearch('');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAreaOnly(false);
    setAppliedBounds(null);
    if (routeLayer === 'official') setTerritoryDomain('calls');
    else if (routeLayer === 'school' || routeLayer === 'health' || routeLayer === 'square') {
      setTerritoryDomain('facilities');
      setFacilityLayers([routeLayer]);
    }
  }, [
    routeNeighborhoodId, routeLayer, neighborhoods.data, setNeighborhood,
    setLayers, setSearch, setMacroTheme, setServiceType, setStatus, setTerritoryDomain, setFacilityLayers,
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<{
    ids: string[]; latitude: number; longitude: number;
  } | null>(null);
  const [searchFocusRequest, setSearchFocusRequest] = useState<string>();
  useFocusEffect(useCallback(() => {
    if (lookup !== 'protocol' || !lookupRequest) return;
    // A consulta de um protocolo não pode herdar filtros que escondam o registro.
    setTerritoryDomain('calls');
    setIsListView(false);
    setFiltersOpen(false);
    setNeighborhood('');
    setStatus('all');
    setPeriod('all');
    setServiceType('all');
    setMacroTheme('all');
    setSearch('');
    setSelectedId(null);
    setSelectedCluster(null);
    setAreaOnly(false);
    setAppliedBounds(null);
    setHasMovedCamera(false);
    setSearchFocusRequest(lookupRequest);
    router.setParams({ lookup: undefined, lookupRequest: undefined, neighborhoodId: undefined,
      layer: undefined, startDate: undefined, endDate: undefined, focusId: undefined,
      lat: undefined, lng: undefined, neighborhood: undefined, filters: undefined });
  }, [lookup, lookupRequest, setTerritoryDomain, setIsListView, setFiltersOpen,
    setNeighborhood, setStatus, setPeriod, setServiceType, setMacroTheme, setSearch]));
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

  const selectedCallQuery = useOfficialCall(selectedId, isFocused && Boolean(selectedId) && layers.includes('official'));
  const focusedCallQuery = useOfficialCall(focusId, isFocused && Boolean(focusId));

  // O foco vindo de notificação/rota vale uma vez por chamado; trocar para Serviços depois não o desfaz.
  const consumedFocusId = useRef<string | null>(null);
  useEffect(() => {
    if (!focusId) {
      consumedFocusId.current = null;
      return;
    }
    if (consumedFocusId.current === focusId) return;
    consumedFocusId.current = focusId;
    setTerritoryDomain('calls');
    if (!layers.includes('official')) setLayers(['official']);
     
    setSelectedId(focusId);
    setSelectedCluster(null);
    setIsListView(false);
    setAreaOnly(false);
    setStatus('all');
    setMacroTheme('all');
    setServiceType('all');
    setSearch('');
    if (paramNeighborhood) setNeighborhood(paramNeighborhood);
  }, [focusId, paramNeighborhood, setTerritoryDomain, layers, setLayers, setIsListView, setNeighborhood, setSearch, setMacroTheme, setServiceType, setStatus]);

  useEffect(() => {
    if (!focusId) return;
    const off = officialCalls.data?.calls?.find((i) => i.id === focusId) || focusedCallQuery.data;
    const targetLat = lat ? Number(lat) : (off?.latitude ?? NaN);
    const targetLng = lng ? Number(lng) : (off?.longitude ?? NaN);
    if (Number.isFinite(targetLat) && Number.isFinite(targetLng)) {
      updateCameraRegion((prev) => ({ ...prev, latitude: targetLat, longitude: targetLng, zoom: 17 }));
    }
  }, [focusId, lat, lng, officialCalls.data?.calls, focusedCallQuery.data, updateCameraRegion]);

  useEffect(() => {
    if (!focusId) return;
    if (focusedCallQuery.isError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToastMessage('Não conseguimos localizar o chamado da notificação.');
    } else if (focusedCallQuery.data && (focusedCallQuery.data.latitude == null || focusedCallQuery.data.longitude == null)) {
      setToastMessage('Este chamado não possui coordenadas registradas no mapa.');
    }
  }, [focusId, focusedCallQuery.isError, focusedCallQuery.data]);

  return {
    spatialMap, setSpatialViewport, selectedCallQuery,
    isFocused,
    colors,
    mode,
    insets,
    mapAvailable,
    listOffsetRef,
    listRef,
    restoreListOffsetRef,
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
    region,
    viewportRef,
    updateCameraRegion,
    areaOnly,
    setAreaOnly,
    setAppliedBounds,
    hasMovedCamera,
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
    searchFocusRequest,
    setStatus,
    setIsListView,
    effectiveListView,
    territoryDomain,
    visitTrace,
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
    locating,
    locationError,
    capturedLocation,
    mapOverlay,
    toastMessage,
    setToastMessage,
    focusedCallQuery,
  };
}
