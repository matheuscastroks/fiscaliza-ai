import { MapMarkerLayers } from '@/components/territory/MapMarkerLayers';
import React, { useRef, useMemo, useEffect, useCallback, useState, memo } from 'react';
import {
  NativeModules,
  Platform,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Constants from 'expo-constants';
import { mapPerformanceEvent } from '@/features/territory/mapPerformance';
import { circleFeature, pointFeature, type MapSearchArea } from '@/features/territory/mapArea';
import { useMapCamera, type CameraBounds, type CameraPadding } from '@/features/territory/useMapCamera';
import type { CapturedDeviceLocation } from '@/features/places/types';
import { MapAreaLayers, MapPositionLayers } from '@/components/territory/MapAreaLayers';
import { computeMapboxZoom, buildMarkersFeatureCollection, normalizeBoundaryFeatureCollection } from '@/features/territory/mapboxGeometry';
import { mapPalette, MAPBOX_STYLE_DARK, MAPBOX_STYLE_LIGHT } from '@/theme/map';

export { computeMapboxZoom, buildMarkersFeatureCollection, normalizeBoundaryFeatureCollection, mapboxStyleUrl } from '@/features/territory/mapboxGeometry';

export type MarkerKind = 'official' | 'school' | 'health' | 'square';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  color?: string;
  kind?: MarkerKind;
}

export interface MapboxRegion {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
  zoom?: number;
  /** Quando presente (objeto novo), a câmera enquadra a caixa em vez de centralizar. */
  bounds?: CameraBounds;
}

export interface MapRegionChange {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  zoom?: number;
  /** Verdadeiro só quando a mudança veio de um gesto do usuário (arrastar, pinçar). */
  userGesture: boolean;
}

export interface MapboxMapViewProps {
  performanceDiagnostics?: boolean;
  diagnosticTrace?: number | null;
  style?: ViewStyle;
  region: MapboxRegion;
  markers?: MapMarker[];
  boundary?: unknown;
  searchArea?: MapSearchArea | null;
  deviceLocation?: CapturedDeviceLocation | null;
  fitSearchArea?: boolean;
  selectedId?: string | null;
  selectedClusterIds?: string[] | null;
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
  onMarkerClick?: (id: string) => void;
  onClusterClick?: (cluster: {
    ids: string[];
    count: number;
    latitude: number;
    longitude: number;
  }) => void;
  onRegionChange?: (region: MapRegionChange) => void;
  interactive?: boolean;
  isDark?: boolean;
  /** Área ocupada por barras e botões sobre o mapa, para enquadrar o conteúdo visível. */
  cameraPadding?: CameraPadding;
  /** Descrição para leitores de tela. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export { MAPBOX_STYLE_DARK, MAPBOX_STYLE_LIGHT };

export function resolveMapboxAccessToken(): string {
  const envToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
  if (envToken) return envToken.trim();
  const extraToken = Constants.expoConfig?.extra?.mapboxAccessToken;
  return typeof extraToken === 'string' ? extraToken.trim() : '';
}

function isNativeMapboxAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  return Boolean(NativeModules?.RNMBXModule);
}

let cachedRnMapbox: any = undefined;
function getRnMapbox(): any {
  if (cachedRnMapbox !== undefined) return cachedRnMapbox;
  if (!isNativeMapboxAvailable()) {
    cachedRnMapbox = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@rnmapbox/maps');
    const Mapbox = mod?.default || mod;
    if (!Mapbox?.MapView || !NativeModules?.RNMBXModule) {
      cachedRnMapbox = null;
      return null;
    }
    const token = resolveMapboxAccessToken();
    if (token) {
      void Mapbox.setAccessToken(token);
    }
    cachedRnMapbox = Mapbox;
    return Mapbox;
  } catch {
    cachedRnMapbox = null;
    return null;
  }
}

export function isMapboxAvailable(): boolean {
  return Boolean(getRnMapbox());
}

const memoComponent = memo || ((c: any) => c);

export const MapboxMapView = memoComponent(function MapboxMapView({
  style,
  region,
  markers = [],
  boundary,
  searchArea,
  deviceLocation,
  fitSearchArea = false,
  selectedId,
  selectedClusterIds,
  onMapClick,
  onMarkerClick,
  onClusterClick,
  onRegionChange,
  interactive = true,
  isDark = false,
  performanceDiagnostics = false,
  diagnosticTrace = null,
  cameraPadding,
  accessibilityLabel,
  accessibilityHint,
}: MapboxMapViewProps) {
  const palette = mapPalette(isDark);
  const [completedTrace, setCompletedTrace] = useState<number | null>(null);
  const mounted = useRef(true);
  const initialTrace = useRef(diagnosticTrace);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const moduleInfo = useMemo(() => {
    const start = performanceDiagnostics ? performance.now() : 0;
    return { Mapbox: getRnMapbox(), durationMs: performanceDiagnostics ? performance.now() - start : 0 };
  }, [performanceDiagnostics]);
  const { Mapbox } = moduleInfo;
  useEffect(() => {
    const trace = initialTrace.current;
    if (performanceDiagnostics) {
      mapPerformanceEvent('mount', {}, trace);
      mapPerformanceEvent('module-ready', { durationMs: moduleInfo.durationMs }, trace);
    }
    return () => { if (performanceDiagnostics) mapPerformanceEvent('unmount', {}, trace); };
  }, [performanceDiagnostics, moduleInfo]);
  const cameraRef = useRef<any>(null);
  const shapeSourceRef = useRef<any>(null);
  const zoom = useMemo(() => computeMapboxZoom(region), [region]);


  const markersResult = useMemo(() => {
    const start = performanceDiagnostics ? performance.now() : 0;
    const shape = buildMarkersFeatureCollection(markers);
    return { shape, durationMs: performanceDiagnostics ? performance.now() - start : 0 };
  }, [markers, performanceDiagnostics]);
  const markersShape = markersResult.shape;
  useEffect(() => {
    if (performanceDiagnostics) {
      mapPerformanceEvent('geojson-ready', { count: markersShape.features.length, durationMs: markersResult.durationMs }, diagnosticTrace);
      mapPerformanceEvent('points-committed', { count: markersShape.features.length }, diagnosticTrace);
    }
  }, [markersShape, markersResult, performanceDiagnostics, diagnosticTrace]);

  const selectedMarker = useMemo(
    () =>
      selectedId ? markers.find((m) => m.id === selectedId) : null,
    [markers, selectedId],
  );
  const selectedMarkerShape = useMemo(
    () =>
      selectedMarker
        ? buildMarkersFeatureCollection([selectedMarker], selectedId)
        : null,
    [selectedMarker, selectedId],
  );

  const boundaryShape = useMemo(
    () => normalizeBoundaryFeatureCollection(boundary),
    [boundary],
  );
  const areaLatitude = searchArea?.latitude;
  const areaLongitude = searchArea?.longitude;
  const areaRadius = searchArea?.radiusMeters;
  const searchCircle = useMemo(() => areaLatitude !== undefined && areaLongitude !== undefined && areaRadius !== undefined
    ? circleFeature({ latitude: areaLatitude, longitude: areaLongitude, radiusMeters: areaRadius }) : null,
  [areaLatitude, areaLongitude, areaRadius]);
  const accuracyCircle = useMemo(() => deviceLocation?.accuracyMeters != null
    ? circleFeature({ ...deviceLocation, radiusMeters: deviceLocation.accuracyMeters }) : null, [deviceLocation]);
  const devicePoint = useMemo(() => pointFeature(deviceLocation), [deviceLocation]);
  const centerPoint = useMemo(() => {
    if (!searchArea || !searchCircle) return null;
    const matchesDevice = deviceLocation?.latitude === searchArea.latitude && deviceLocation?.longitude === searchArea.longitude;
    return searchArea.source === 'place' || !matchesDevice ? pointFeature(searchArea) : null;
  }, [searchArea, searchCircle, deviceLocation]);

  useMapCamera(cameraRef, { latitude: region.latitude, longitude: region.longitude, zoom, bounds: region.bounds },
    searchCircle, fitSearchArea, searchArea?.capturedAt, cameraPadding);

  const handleShapePress = useCallback(
    async (event: any) => {
      const feature = event?.features?.[0];
      if (!feature) return;
      if (feature.properties?.cluster) {
        // Android parses this argument as a GeoJSON Feature, not a cluster ID.
        let leaves: any;
        try {
          leaves = await shapeSourceRef.current?.getClusterLeaves(feature, 100, 0);
        } catch {
          // Sem a lista de itens, o grupo ainda dá zoom no ponto tocado.
          leaves = undefined;
        }
        const childIds: string[] = (leaves?.features || [])
          .map((f: any) => String(f.id || f.properties?.id))
          .filter(Boolean);
        const coords = feature.geometry?.coordinates;
        if (coords) {
          onClusterClick?.({
            ids: childIds,
            count: Number(feature.properties.point_count) || childIds.length,
            longitude: Number(coords[0]),
            latitude: Number(coords[1]),
          });
        }
        return;
      }
      const markerId = feature.id || feature.properties?.id;
      if (markerId && onMarkerClick) {
        onMarkerClick(String(markerId));
      }
    },
    [onClusterClick, onMarkerClick],
  );

  const handleMapPress = useCallback(
    (e: any) => {
      const coords = e?.geometry?.coordinates;
      if (Array.isArray(coords) && coords.length >= 2) {
        onMapClick?.({
          longitude: Number(coords[0]),
          latitude: Number(coords[1]),
        });
      }
    },
    [onMapClick],
  );

  const lastEmittedCameraRef = useRef({ lat: 0, lng: 0, zoom: 0 });
  const handleCameraChanged = useCallback(
    (state: any) => {
      const center = state?.properties?.center;
      const currentZoom = state?.properties?.zoom;
      if (Array.isArray(center) && center.length >= 2) {
        const lat = Number(center[1]);
        const lng = Number(center[0]);
        const z = typeof currentZoom === 'number' ? currentZoom : zoom;
        const last = lastEmittedCameraRef.current;
        if (
          Math.abs(lat - last.lat) < 0.00005 &&
          Math.abs(lng - last.lng) < 0.00005 &&
          Math.abs(z - last.zoom) < 0.02
        ) {
          return;
        }
        lastEmittedCameraRef.current = { lat, lng, zoom: z };
        const approxDelta = 360 / Math.pow(2, Math.max(1, z));
        // Movimentos da própria câmera (enquadrar, localizar) não contam como gesto.
        const userGesture = Boolean(state?.gestures?.isGestureActive);
        onRegionChange?.({
          userGesture,
          latitude: lat,
          longitude: lng,
          latitudeDelta: approxDelta,
          longitudeDelta: approxDelta,
          zoom: z,
        });
      }
    },
    [onRegionChange, zoom],
  );

  const containerStyle = [styles.container, { backgroundColor: palette.background }, style];
  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityLabel, accessibilityHint }
    : {};

  if (!Mapbox) {
    return <View style={containerStyle} {...a11y} />;
  }

  return (
    <View style={containerStyle} {...a11y}>
      <Mapbox.MapView
        style={StyleSheet.absoluteFill}
        styleURL={palette.styleUrl}
        localizeLabels={{ locale: 'pt' }}
        scrollEnabled={interactive}
        pitchEnabled={false}
        rotateEnabled={false}
        attributionEnabled={false}
        logoEnabled={false}
        scaleBarEnabled={false}
        onPress={handleMapPress}
        onCameraChanged={handleCameraChanged}
        onDidFinishLoadingStyle={performanceDiagnostics ? () => { if (mounted.current) mapPerformanceEvent('style-loaded', {}, diagnosticTrace); } : undefined}
        onDidFinishRenderingFrameFully={performanceDiagnostics && diagnosticTrace !== null && completedTrace !== diagnosticTrace ? () => {
          if (!mounted.current) return;
          mapPerformanceEvent('frame-ready', {}, diagnosticTrace);
          setCompletedTrace(diagnosticTrace);
        } : undefined}
        onMapLoadingError={performanceDiagnostics ? () => { if (mounted.current) mapPerformanceEvent('load-error', {}, diagnosticTrace); } : undefined}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [region.longitude, region.latitude],
            zoomLevel: zoom,
          }}
        />

        {boundaryShape.features.length > 0 && (
          <Mapbox.ShapeSource id="boundary-source" shape={boundaryShape}>
            <Mapbox.FillLayer
              id="boundary-fill"
              style={{
                fillColor: palette.boundary,
                fillOpacity: 0.08,
              }}
            />
            <Mapbox.LineLayer
              id="boundary-line"
              style={{
                lineColor: palette.boundary,
                lineWidth: 2,
                lineOpacity: 0.8,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        <MapAreaLayers Mapbox={Mapbox} searchCircle={searchCircle} accuracyCircle={accuracyCircle} isDark={isDark} />

        <MapMarkerLayers Mapbox={Mapbox} shapeSourceRef={shapeSourceRef} markersShape={markersShape} selectedMarkerShape={selectedMarkerShape} handleShapePress={handleShapePress} isDark={isDark} />

        <MapPositionLayers Mapbox={Mapbox} centerPoint={centerPoint} devicePoint={devicePoint} isDark={isDark} />

      </Mapbox.MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
