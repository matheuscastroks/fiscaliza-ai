import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  NativeModules,
  Platform,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
import { scriptJson } from '@/features/territory/selectors';

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
  const b = boundary as { type?: string; features?: unknown[]; geometry?: unknown };
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

function NativeMapboxView({
  style,
  region,
  markers = [],
  boundary,
  selectedId,
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
      const coords = feature.geometry?.coordinates;
      const lng = Array.isArray(coords) ? Number(coords[0]) : region.longitude;
      const lat = Array.isArray(coords) ? Number(coords[1]) : region.latitude;

      if (feature.properties?.cluster) {
        const count = Number(feature.properties.point_count || 0);
        if (count > 10) {
          try {
            const expansionZoom =
              await shapeSourceRef.current?.getClusterExpansionZoom(feature);
            cameraRef.current?.setCamera({
              centerCoordinate: [lng, lat],
              zoomLevel:
                typeof expansionZoom === 'number' ? expansionZoom : zoom + 2,
              animationDuration: 300,
            });
          } catch {
            cameraRef.current?.setCamera({
              centerCoordinate: [lng, lat],
              zoomLevel: Math.min(18, zoom + 2),
              animationDuration: 300,
            });
          }
          return;
        }
        try {
          const children =
            await shapeSourceRef.current?.getClusterChildren(feature);
          const ids = Array.isArray(children?.features)
            ? children.features
                .map((f: any) => String(f?.properties?.id || f?.id || ''))
                .filter(Boolean)
            : [];
          onClusterClick?.({
            ids,
            count: ids.length || count,
            latitude: lat,
            longitude: lng,
          });
        } catch {
          onClusterClick?.({ ids: [], count, latitude: lat, longitude: lng });
        }
        return;
      }

      const id = String(feature.properties?.id || feature.id || '');
      if (id) onMarkerClick?.(id);
    },
    [onClusterClick, onMarkerClick, region.latitude, region.longitude, zoom],
  );

  return (
    <View style={[styles.container, style]}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={mapboxStyleUrl(isDark)}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        pitchEnabled={false}
        rotateEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        onPress={(feature: any) => {
          const coords = feature?.geometry?.coordinates;
          if (Array.isArray(coords) && coords.length >= 2) {
            onMapClick?.({
              longitude: Number(coords[0]),
              latitude: Number(coords[1]),
            });
          }
        }}
        onMapIdle={(state: any) => {
          const center = state?.properties?.center;
          const bounds = state?.properties?.bounds;
          const currentZoom = state?.properties?.zoom ?? zoom;
          if (!Array.isArray(center) || center.length < 2) return;
          const lng = Number(center[0]);
          const lat = Number(center[1]);
          const ne = bounds?.ne;
          const sw = bounds?.sw;
          const latitudeDelta =
            Array.isArray(ne) && Array.isArray(sw)
              ? Math.max(0.001, Math.abs(Number(ne[1]) - Number(sw[1])))
              : 0.04;
          const longitudeDelta =
            Array.isArray(ne) && Array.isArray(sw)
              ? Math.max(0.001, Math.abs(Number(ne[0]) - Number(sw[0])))
              : 0.04;
          lastCenterRef.current = {
            latitude: lat,
            longitude: lng,
            zoom: currentZoom,
          };
          onRegionChange?.({
            latitude: lat,
            longitude: lng,
            latitudeDelta,
            longitudeDelta,
            zoom: currentZoom,
          });
        }}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [region.longitude, region.latitude],
            zoomLevel: zoom,
          }}
        />
        <Mapbox.ShapeSource id="boundary-source" shape={boundaryShape}>
          <Mapbox.FillLayer
            id="boundary-fill"
            style={{
              fillColor: '#0072BB',
              fillOpacity: isDark ? 0.14 : 0.08,
            }}
          />
          <Mapbox.LineLayer
            id="boundary-line"
            style={{
              lineColor: '#0072BB',
              lineWidth: 2,
              lineOpacity: isDark ? 0.85 : 0.65,
            }}
          />
        </Mapbox.ShapeSource>

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

function buildMapboxGlHtml(options: {
  accessToken: string;
  isDark: boolean;
  interactive: boolean;
  latitude: number;
  longitude: number;
  zoom: number;
}) {
  const { accessToken, isDark, interactive, latitude, longitude, zoom } =
    options;
  const styleUrl = mapboxStyleUrl(isDark);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css" rel="stylesheet" />
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.js"></script>
  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background: ${isDark ? '#121212' : '#f8fafc'};
      overflow: hidden;
      touch-action: none;
    }
    .mapboxgl-ctrl-attrib {
      font-size: 9px !important;
      opacity: 0.78;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function postAppMessage(data) {
      var str = JSON.stringify(data);
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(str);
      } else if (window.parent && window.parent.postMessage) {
        window.parent.postMessage(str, '*');
      }
    }

    mapboxgl.accessToken = ${scriptJson(accessToken)};
    var isProgrammaticMove = false;
    var currentStyleUrl = ${scriptJson(styleUrl)};
    var latestMarkersPayload = { markers: [], selectedId: null, clusterIds: [] };
    var latestBoundary = null;
    var draggableMarkerMap = Object.create(null);

    var map = new mapboxgl.Map({
      container: 'map',
      style: currentStyleUrl,
      center: [${longitude}, ${latitude}],
      zoom: ${zoom},
      minZoom: 9,
      maxZoom: 19,
      interactive: ${interactive},
      pitchWithRotate: false,
      dragRotate: false,
      touchPitch: false,
      attributionControl: true
    });

    function buildFeatureCollection(markers, selectedId, clusterIds) {
      var clusterSet = Object.create(null);
      (clusterIds || []).forEach(function(id) { clusterSet[id] = true; });
      var features = [];
      (markers || []).forEach(function(m) {
        if (m.draggable) return;
        if (typeof m.latitude !== 'number' || typeof m.longitude !== 'number') return;
        features.push({
          type: 'Feature',
          id: m.id,
          properties: {
            id: m.id,
            title: m.title || '',
            color: /^#[0-9a-f]{6}$/i.test(m.color || '') ? m.color : '#0072BB',
            kind: m.kind || 'official',
            selected: m.id === selectedId ? 1 : 0,
            inSelectedCluster: clusterSet[m.id] ? 1 : 0
          },
          geometry: {
            type: 'Point',
            coordinates: [m.longitude, m.latitude]
          }
        });
      });
      return { type: 'FeatureCollection', features: features };
    }

    function normalizeBoundary(boundary) {
      if (!boundary || typeof boundary !== 'object') {
        return { type: 'FeatureCollection', features: [] };
      }
      if (boundary.type === 'FeatureCollection') return boundary;
      if (boundary.type === 'Feature') {
        return { type: 'FeatureCollection', features: [boundary] };
      }
      return {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: {}, geometry: boundary }]
      };
    }

    function ensureLayers() {
      if (!map.getSource('boundary-source')) {
        map.addSource('boundary-source', {
          type: 'geojson',
          data: normalizeBoundary(latestBoundary)
        });
        map.addLayer({
          id: 'boundary-fill',
          type: 'fill',
          source: 'boundary-source',
          paint: {
            'fill-color': '#0072BB',
            'fill-opacity': 0.1
          }
        });
        map.addLayer({
          id: 'boundary-line',
          type: 'line',
          source: 'boundary-source',
          paint: {
            'line-color': '#0072BB',
            'line-width': 2,
            'line-opacity': 0.72
          }
        });
      }

      if (!map.getSource('markers-source')) {
        map.addSource('markers-source', {
          type: 'geojson',
          data: buildFeatureCollection(
            latestMarkersPayload.markers,
            latestMarkersPayload.selectedId,
            latestMarkersPayload.clusterIds
          ),
          cluster: true,
          clusterMaxZoom: 15,
          clusterRadius: 48
        });

        map.addLayer({
          id: 'clusters-circle',
          type: 'circle',
          source: 'markers-source',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#212529',
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20,
              10,
              23,
              50,
              26
            ],
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff'
          }
        });

        map.addLayer({
          id: 'clusters-count',
          type: 'symbol',
          source: 'markers-source',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
            'text-size': 13,
            'text-allow-overlap': true
          },
          paint: {
            'text-color': '#ffffff'
          }
        });

        map.addLayer({
          id: 'unclustered-point-halo',
          type: 'circle',
          source: 'markers-source',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'selected'], 1]],
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': 18,
            'circle-opacity': 0.25
          }
        });

        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'markers-source',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': [
              'case',
              ['==', ['get', 'selected'], 1],
              11,
              8
            ],
            'circle-stroke-width': [
              'case',
              ['==', ['get', 'selected'], 1],
              3,
              2
            ],
            'circle-stroke-color': '#ffffff'
          }
        });
      }
    }

    map.on('style.load', function() {
      ensureLayers();
    });

    map.on('click', function(e) {
      var features = map.queryRenderedFeatures(e.point, {
        layers: ['clusters-circle', 'unclustered-point']
      });
      if (features && features.length > 0) {
        var f = features[0];
        var coords = f.geometry && f.geometry.coordinates;
        var lng = coords ? coords[0] : e.lngLat.lng;
        var lat = coords ? coords[1] : e.lngLat.lat;

        if (f.properties && f.properties.cluster) {
          var clusterId = f.properties.cluster_id;
          var count = Number(f.properties.point_count || 0);
          var source = map.getSource('markers-source');
          if (!source) return;
          if (count > 10) {
            source.getClusterExpansionZoom(clusterId, function(err, targetZoom) {
              if (err) return;
              map.easeTo({
                center: [lng, lat],
                zoom: Math.min(targetZoom + 1, 18),
                duration: 320
              });
            });
          } else {
            source.getClusterLeaves(clusterId, 20, 0, function(err, leaves) {
              var ids = (!err && Array.isArray(leaves))
                ? leaves.map(function(leaf) { return leaf.properties && leaf.properties.id; }).filter(Boolean)
                : [];
              postAppMessage({
                type: 'onClusterClick',
                ids: ids,
                count: ids.length || count,
                latitude: lat,
                longitude: lng
              });
            });
          }
          return;
        }

        if (f.properties && f.properties.id) {
          postAppMessage({ type: 'onMarkerClick', id: String(f.properties.id) });
          return;
        }
      }

      postAppMessage({
        type: 'onMapClick',
        latitude: e.lngLat.lat,
        longitude: e.lngLat.lng
      });
    });

    map.on('moveend', function() {
      if (isProgrammaticMove) {
        isProgrammaticMove = false;
        return;
      }
      var center = map.getCenter();
      var bounds = map.getBounds();
      var latDelta = Math.max(0.001, Math.abs(bounds.getNorth() - bounds.getSouth()));
      var lngDelta = Math.max(0.001, Math.abs(bounds.getEast() - bounds.getWest()));
      postAppMessage({
        type: 'onRegionChange',
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
        zoom: map.getZoom()
      });
    });

    function syncDraggableMarkers(markers) {
      var nextDraggable = Object.create(null);
      (markers || []).forEach(function(m) {
        if (!m.draggable) return;
        nextDraggable[m.id] = true;
        var existing = draggableMarkerMap[m.id];
        if (!existing) {
          var el = document.createElement('div');
          el.style.width = '22px';
          el.style.height = '22px';
          el.style.borderRadius = '11px';
          el.style.background = m.color || '#212529';
          el.style.border = '3px solid #ffffff';
          el.style.boxShadow = '0 3px 8px rgba(0,0,0,0.32)';
          var instance = new mapboxgl.Marker({ element: el, draggable: true })
            .setLngLat([m.longitude, m.latitude])
            .addTo(map);
          instance.on('dragend', function() {
            var pos = instance.getLngLat();
            postAppMessage({
              type: 'onMapClick',
              latitude: pos.lat,
              longitude: pos.lng
            });
          });
          draggableMarkerMap[m.id] = instance;
        } else {
          existing.setLngLat([m.longitude, m.latitude]);
        }
      });
      Object.keys(draggableMarkerMap).forEach(function(id) {
        if (!nextDraggable[id]) {
          draggableMarkerMap[id].remove();
          delete draggableMarkerMap[id];
        }
      });
    }

    function updateMarkers(markers, selectedId, clusterIds) {
      latestMarkersPayload = {
        markers: markers || [],
        selectedId: selectedId || null,
        clusterIds: clusterIds || []
      };
      syncDraggableMarkers(markers);
      var source = map.getSource('markers-source');
      if (source && source.setData) {
        source.setData(buildFeatureCollection(markers, selectedId, clusterIds));
      }
    }

    window.setView = function(lat, lng, nextZoom) {
      isProgrammaticMove = true;
      map.easeTo({
        center: [lng, lat],
        zoom: typeof nextZoom === 'number' ? nextZoom : map.getZoom(),
        duration: 300
      });
    };

    window.setBoundary = function(boundary) {
      latestBoundary = boundary;
      var source = map.getSource('boundary-source');
      if (source && source.setData) {
        source.setData(normalizeBoundary(boundary));
      }
    };

    window.setMarkers = function(newMarkers, newSelectedId, newClusterIds) {
      updateMarkers(newMarkers, newSelectedId, newClusterIds);
    };

    window.addEventListener('message', function(event) {
      try {
        var msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (msg && msg.command && typeof window[msg.command] === 'function') {
          window[msg.command].apply(null, msg.args || []);
        }
      } catch (e) {}
    });
  </script>
</body>
</html>`;
}

export function MapboxMapView(props: MapboxMapViewProps) {
  const {
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
  } = props;

  const nativeMapbox = getRnMapbox();
  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const zoom = useMemo(() => computeMapboxZoom(region), [region]);
  const lastCenterRef = useRef<{
    latitude: number;
    longitude: number;
    zoom?: number;
  }>({
    latitude: region.latitude,
    longitude: region.longitude,
    zoom,
  });
  const lastMarkersJsonRef = useRef<string>('');

  const dispatch = useCallback((command: string, args: unknown[]) => {
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage({ command, args }, '*');
    } else {
      webViewRef.current?.injectJavaScript(
        'if(window[' +
          scriptJson(command) +
          ']) window[' +
          scriptJson(command) +
          '].apply(null,' +
          scriptJson(args) +
          '); true;',
      );
    }
  }, []);

  const receive = useCallback(
    (data: any) => {
      if (!data || typeof data !== 'object') return;
      if (data.type === 'onMapClick') {
        onMapClick?.({ latitude: data.latitude, longitude: data.longitude });
      }
      if (data.type === 'onMarkerClick') {
        onMarkerClick?.(data.id);
      }
      if (data.type === 'onClusterClick') {
        onClusterClick?.(data);
      }
      if (data.type === 'onRegionChange') {
        lastCenterRef.current = data;
        onRegionChange?.(data);
      }
    },
    [onMapClick, onMarkerClick, onClusterClick, onRegionChange],
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const listener = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      try {
        receive(
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data,
        );
      } catch {}
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [receive]);

  const accessToken = useMemo(() => resolveMapboxAccessToken(), []);

  const htmlContent = useMemo(
    () =>
      buildMapboxGlHtml({
        accessToken,
        isDark,
        interactive,
        latitude: region.latitude,
        longitude: region.longitude,
        zoom,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accessToken, isDark, interactive],
  );

  const nativeSource = useMemo(() => ({ html: htmlContent }), [htmlContent]);

  useEffect(() => {
    if (nativeMapbox) return;
    const last = lastCenterRef.current;
    const currentTargetZoom = region.zoom ?? zoom;
    const isSameLat = Math.abs(region.latitude - last.latitude) < 0.0001;
    const isSameLng = Math.abs(region.longitude - last.longitude) < 0.0001;
    const isSameZoom =
      last.zoom !== undefined
        ? Math.abs(currentTargetZoom - last.zoom) < 0.2
        : false;
    if (isSameLat && isSameLng && isSameZoom) return;

    lastCenterRef.current = {
      latitude: region.latitude,
      longitude: region.longitude,
      zoom: currentTargetZoom,
    };
    dispatch('setView', [region.latitude, region.longitude, currentTargetZoom]);
  }, [
    nativeMapbox,
    region.latitude,
    region.longitude,
    region.zoom,
    zoom,
    dispatch,
  ]);

  useEffect(() => {
    if (nativeMapbox) return;
    const payload = JSON.stringify({
      markers,
      selectedId: selectedId || null,
      selectedClusterIds: selectedClusterIds || null,
    });
    if (payload === lastMarkersJsonRef.current) return;
    lastMarkersJsonRef.current = payload;
    dispatch('setMarkers', [
      markers,
      selectedId || null,
      selectedClusterIds || [],
    ]);
  }, [nativeMapbox, markers, selectedId, selectedClusterIds, dispatch]);

  useEffect(() => {
    if (nativeMapbox) return;
    dispatch('setBoundary', [boundary || null]);
  }, [nativeMapbox, boundary, dispatch]);

  if (nativeMapbox) {
    return <NativeMapboxView {...props} />;
  }

  return (
    <View style={[styles.container, style]}>
      {Platform.OS === 'web' ? (
        React.createElement('iframe', {
          ref: iframeRef,
          title: 'Mapa do território',
          srcDoc: htmlContent,
          style: { width: '100%', height: '100%', border: 0 },
          onLoad: () => {
            dispatch('setMarkers', [
              markers,
              selectedId || null,
              selectedClusterIds || [],
            ]);
            dispatch('setBoundary', [boundary || null]);
          },
        })
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={nativeSource}
          style={styles.map}
          scrollEnabled={interactive}
          bounces={false}
          overScrollMode="never"
          javaScriptEnabled
          domStorageEnabled
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onLoadEnd={() => {
            dispatch('setMarkers', [
              markers,
              selectedId || null,
              selectedClusterIds || [],
            ]);
            dispatch('setBoundary', [boundary || null]);
          }}
          onMessage={(event) => {
            try {
              receive(JSON.parse(event.nativeEvent.data));
            } catch {}
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  draggablePin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
});
