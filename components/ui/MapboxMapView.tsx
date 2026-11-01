import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import {
  NativeModules,
  Platform,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Constants from 'expo-constants';

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

export const MAPBOX_STYLE_LIGHT = 'mapbox://styles/mapbox/light-v11';
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
  return {
    type: 'FeatureCollection' as const,
    features: markers
      .filter(
        (m) =>
          typeof m.latitude === 'number' &&
          typeof m.longitude === 'number' &&
          Number.isFinite(m.latitude) &&
          Number.isFinite(m.longitude),
      )
      .map((m) => ({
        type: 'Feature' as const,
        id: m.id,
        properties: {
          id: m.id,
          title: m.title || '',
          color: /^#[0-9a-f]{6}$/i.test(m.color || '') ? m.color! : '#0072BB',
          kind: m.kind || 'official',
          draggable: Boolean(m.draggable),
          selected: m.id === selectedId ? 1 : 0,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [m.longitude, m.latitude] as [number, number],
        },
      })),
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

export function MapboxMapView({
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
}: MapboxMapViewProps) {
  const Mapbox = getRnMapbox();
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

  const markersShape = useMemo(
    () => buildMarkersFeatureCollection(nonDraggableMarkers, selectedId),
    [nonDraggableMarkers, selectedId],
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
        const clusterId = feature.properties.cluster_id;
        const leaves = await shapeSourceRef.current?.getClusterLeaves(
          clusterId,
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
        onPress={(e: any) => {
          const coords = e?.geometry?.coordinates;
          if (Array.isArray(coords) && coords.length >= 2) {
            onMapClick?.({
              longitude: Number(coords[0]),
              latitude: Number(coords[1]),
            });
          }
        }}
        onCameraChanged={(state: any) => {
          const center = state?.properties?.center;
          const currentZoom = state?.properties?.zoom;
          if (Array.isArray(center) && center.length >= 2) {
            const lat = Number(center[1]);
            const lng = Number(center[0]);
            const z = typeof currentZoom === 'number' ? currentZoom : zoom;
            const approxDelta = 360 / Math.pow(2, Math.max(1, z));
            onRegionChange?.({
              latitude: lat,
              longitude: lng,
              latitudeDelta: approxDelta,
              longitudeDelta: approxDelta,
              zoom: z,
            });
          }
        }}
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
              circleRadius: ['case', ['==', ['get', 'selected'], 1], 12, 8],
              circleStrokeWidth: [
                'case',
                ['==', ['get', 'selected'], 1],
                3.5,
                2,
              ],
              circleStrokeColor: '#ffffff',
            }}
          />
        </Mapbox.ShapeSource>

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
}

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
