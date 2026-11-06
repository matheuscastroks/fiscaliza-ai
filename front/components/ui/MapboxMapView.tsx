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

export type MarkerKind =
  | 'occurrence'
  | 'proposal'
  | 'consultation'
  | 'action'
  | 'official'
  | 'school'
  | 'health'
  | 'square';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  color?: string;
  kind?: MarkerKind;
  draggable?: boolean;
}

export interface MapboxRegion {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
  zoom?: number;
}

export interface MapboxMapViewProps {
  performanceDiagnostics?: boolean;
  diagnosticTrace?: number | null;
  style?: ViewStyle;
  region: MapboxRegion;
  markers?: MapMarker[];
  boundary?: unknown;
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
  onRegionChange?: (region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
    zoom?: number;
  }) => void;
  interactive?: boolean;
  isDark?: boolean;
}

export const MAPBOX_STYLE_STREETS = 'mapbox://styles/mapbox/streets-v12';
export const MAPBOX_STYLE_LIGHT = MAPBOX_STYLE_STREETS;
export const MAPBOX_STYLE_DARK = 'mapbox://styles/mapbox/dark-v11';

export function resolveMapboxAccessToken(): string {
  const envToken =
    process.env.EXPO_PUBLIC_API_MAPBOX ||
    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    '';
  if (envToken) return envToken.trim();
  const extraToken = Constants.expoConfig?.extra?.mapboxAccessToken;
  return typeof extraToken === 'string' ? extraToken.trim() : '';
}

export function mapboxStyleUrl(isDark?: boolean): string {
  return isDark ? MAPBOX_STYLE_DARK : MAPBOX_STYLE_LIGHT;
}

export function computeMapboxZoom(region: MapboxRegion): number {
  if (typeof region.zoom === 'number' && Number.isFinite(region.zoom)) {
    return region.zoom;
  }
  const delta = Math.max(
    region.latitudeDelta || 0.05,
    region.longitudeDelta || 0.05,
    0.001,
  );
  return Math.max(3, Math.min(18, Math.round(Math.log2(360 / delta))));
}

export function buildMarkersFeatureCollection(
  markers: MapMarker[],
  selectedId?: string | null,
) {
  const len = markers.length;
  const features = new Array(len);
  let count = 0;
  for (let i = 0; i < len; i++) {
    const m = markers[i];
    const lat = m.latitude;
    const lng = m.longitude;
    if (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      const c = m.color;
      const validColor =
        c && c.length === 7 && c.charCodeAt(0) === 35 && /^#[0-9a-f]{6}$/i.test(c)
          ? c
          : '#0072BB';
      features[count++] = {
        type: 'Feature' as const,
        id: m.id,
        properties: {
          id: m.id,
          title: m.title || '',
          color: validColor,
          kind: m.kind || 'official',
          draggable: Boolean(m.draggable),
          selected: m.id === selectedId ? 1 : 0,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [lng, lat] as [number, number],
        },
      };
    }
  }
  if (count < len) {
    features.length = count;
  }
  return {
    type: 'FeatureCollection' as const,
    features,
  };
}

export function normalizeBoundaryFeatureCollection(boundary: unknown) {
  if (!boundary || typeof boundary !== 'object') {
    return { type: 'FeatureCollection' as const, features: [] };
  }
  const b = boundary as {
    type?: string;
    features?: unknown[];
    geometry?: unknown;
  };
  if (b.type === 'FeatureCollection' && Array.isArray(b.features)) {
    return b as { type: 'FeatureCollection'; features: unknown[] };
  }
  if (b.type === 'Feature' && b.geometry) {
    return { type: 'FeatureCollection' as const, features: [b] };
  }
  if (b.type === 'Polygon' || b.type === 'MultiPolygon') {
    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: b,
        },
      ],
    };
  }
  return { type: 'FeatureCollection' as const, features: [] };
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

const memoComponent = memo || ((c: any) => c);

export const MapboxMapView = memoComponent(function MapboxMapView({
  style,
  region,
  markers = [],
  boundary,
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
}: MapboxMapViewProps) {
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
  const lastCenterRef = useRef({
    latitude: region.latitude,
    longitude: region.longitude,
    zoom,
  });

  const nonDraggableMarkers = useMemo(
    () => markers.filter((m) => !m.draggable),
    [markers],
  );
  const draggableMarkers = useMemo(
    () => markers.filter((m) => m.draggable),
    [markers],
  );

  const markersResult = useMemo(() => {
    const start = performanceDiagnostics ? performance.now() : 0;
    const shape = buildMarkersFeatureCollection(nonDraggableMarkers);
    return { shape, durationMs: performanceDiagnostics ? performance.now() - start : 0 };
  }, [nonDraggableMarkers, performanceDiagnostics]);
  const markersShape = markersResult.shape;
  useEffect(() => {
    if (performanceDiagnostics) {
      mapPerformanceEvent('geojson-ready', { count: markersShape.features.length, durationMs: markersResult.durationMs }, diagnosticTrace);
      mapPerformanceEvent('points-committed', { count: markersShape.features.length }, diagnosticTrace);
    }
  }, [markersShape, markersResult, performanceDiagnostics, diagnosticTrace]);

  const selectedMarker = useMemo(
    () =>
      selectedId ? nonDraggableMarkers.find((m) => m.id === selectedId) : null,
    [nonDraggableMarkers, selectedId],
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

  useEffect(() => {
    const last = lastCenterRef.current;
    const isSameLat = Math.abs(region.latitude - last.latitude) < 0.0001;
    const isSameLng = Math.abs(region.longitude - last.longitude) < 0.0001;
    const isSameZoom = Math.abs(zoom - last.zoom) < 0.2;
    if (isSameLat && isSameLng && isSameZoom) return;

    lastCenterRef.current = {
      latitude: region.latitude,
      longitude: region.longitude,
      zoom,
    };
    cameraRef.current?.setCamera({
      centerCoordinate: [region.longitude, region.latitude],
      zoomLevel: zoom,
      animationDuration: 350,
    });
  }, [region.latitude, region.longitude, zoom]);

  const handleShapePress = useCallback(
    async (event: any) => {
      const feature = event?.features?.[0];
      if (!feature) return;
      if (feature.properties?.cluster) {
        // Android parses this argument as a GeoJSON Feature, not a cluster ID.
        const leaves = await shapeSourceRef.current?.getClusterLeaves(
          feature,
          100,
          0,
        );
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
        onRegionChange?.({
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

  if (!Mapbox) {
    return <View style={[styles.container, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <Mapbox.MapView
        style={StyleSheet.absoluteFill}
        styleURL={mapboxStyleUrl(isDark)}
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
                fillColor: '#0072BB',
                fillOpacity: 0.08,
              }}
            />
            <Mapbox.LineLayer
              id="boundary-line"
              style={{
                lineColor: '#0072BB',
                lineWidth: 2,
                lineOpacity: 0.8,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        <Mapbox.ShapeSource
          ref={shapeSourceRef}
          id="markers-source"
          shape={markersShape}
          cluster
          clusterRadius={48}
          clusterMaxZoomLevel={15}
          onPress={handleShapePress}
        >
          <Mapbox.CircleLayer
            id="clusters-circle"
            filter={['has', 'point_count']}
            style={{
              circleColor: '#212529',
              circleRadius: [
                'step',
                ['get', 'point_count'],
                20,
                10,
                23,
                50,
                26,
              ],
              circleStrokeWidth: 2.5,
              circleStrokeColor: '#ffffff',
            }}
          />
          <Mapbox.SymbolLayer
            id="clusters-count"
            filter={['has', 'point_count']}
            style={{
              textField: ['get', 'point_count_abbreviated'],
              textSize: 13,
              textColor: '#ffffff',
              textIgnorePlacement: true,
              textAllowOverlap: true,
            }}
          />
          <Mapbox.CircleLayer
            id="unclustered-point"
            filter={['!', ['has', 'point_count']]}
            style={{
              circleColor: ['get', 'color'],
              circleRadius: 8,
              circleStrokeWidth: 2,
              circleStrokeColor: '#ffffff',
            }}
          />
        </Mapbox.ShapeSource>

        {selectedMarkerShape && (
          <Mapbox.ShapeSource
            id="selected-marker-source"
            shape={selectedMarkerShape}
          >
            <Mapbox.CircleLayer
              id="selected-marker-halo"
              style={{
                circleColor: ['get', 'color'],
                circleRadius: 13,
                circleStrokeWidth: 3.5,
                circleStrokeColor: '#ffffff',
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {draggableMarkers.map((m) => (
          <Mapbox.PointAnnotation
            key={m.id}
            id={m.id}
            coordinate={[m.longitude, m.latitude]}
            draggable
            onSelected={() => onMarkerClick?.(m.id)}
            onDragEnd={(e: any) => {
              const coords = e?.geometry?.coordinates;
              if (Array.isArray(coords) && coords.length >= 2) {
                onMapClick?.({
                  longitude: Number(coords[0]),
                  latitude: Number(coords[1]),
                });
              }
            }}
          >
            <View
              style={[
                styles.draggablePin,
                { backgroundColor: m.color || '#212529' },
              ]}
            />
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  draggablePin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.32,
    shadowRadius: 5,
    elevation: 4,
  },
});
