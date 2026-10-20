import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

export type MarkerKind = 'occurrence' | 'proposal' | 'consultation' | 'action';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  color?: string;
  kind?: MarkerKind;
  draggable?: boolean;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
  zoom?: number;
}

interface OsmMapViewProps {
  style?: StyleProp<ViewStyle>;
  region: MapRegion;
  markers?: MapMarker[];
  selectedId?: string | null;
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
  onMarkerClick?: (id: string) => void;
  onRegionChange?: (region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => void;
  interactive?: boolean;
  isDark?: boolean;
}

export function OsmMapView({
  style,
  region,
  markers = [],
  selectedId,
  onMapClick,
  onMarkerClick,
  onRegionChange,
  interactive = true,
  isDark = false,
}: OsmMapViewProps) {
  const webViewRef = useRef<WebView>(null);

  const zoom = useMemo(() => {
    if (region.zoom) return region.zoom;
    const delta = Math.max(region.latitudeDelta || 0.05, region.longitudeDelta || 0.05, 0.001);
    return Math.max(3, Math.min(18, Math.round(Math.log2(360 / delta))));
  }, [region.zoom, region.latitudeDelta, region.longitudeDelta]);

  const htmlContent = useMemo(() => {
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution = isDark
      ? '&copy; OpenStreetMap &copy; CARTO'
      : '&copy; OpenStreetMap contributors';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
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
    .leaflet-control-attribution {
      font-size: 8px !important;
      background: rgba(255,255,255,0.7) !important;
    }
    .custom-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    }
    .custom-marker.selected {
      transform: scale(1.22);
      z-index: 1000 !important;
    }
    .marker-pin {
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      position: absolute;
      transform: rotate(-45deg);
      left: 50%;
      top: 50%;
      margin: -16px 0 0 -16px;
      box-shadow: 0 3px 8px rgba(0,0,0,0.35);
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .marker-icon-wrapper {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
    }
    .marker-icon-wrapper svg {
      width: 14px;
      height: 14px;
      fill: #ffffff;
    }
    .pulse-ring {
      position: absolute;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.8);
      top: 50%;
      left: 50%;
      margin: -22px 0 0 -22px;
      animation: pulse 1.8s infinite ease-out;
      pointer-events: none;
    }
    @keyframes pulse {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.3); opacity: 0; }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
      dragging: ${interactive},
      touchZoom: ${interactive},
      scrollWheelZoom: ${interactive},
      doubleClickZoom: ${interactive}
    }).setView([${region.latitude}, ${region.longitude}], ${zoom});

    L.tileLayer('${tileUrl}', {
      maxZoom: 19,
      attribution: '${attribution}'
    }).addTo(map);

    var markerLayer = L.layerGroup().addTo(map);

    var SVG_ICONS = {
      occurrence: '<svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V8h2v4z"/></svg>',
      proposal: '<svg viewBox="0 0 24 24"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>',
      consultation: '<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2z"/></svg>',
      action: '<svg viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>'
    };

    function createMarkerIcon(markerData, isSelected) {
      var pinColor = markerData.color || '#2563eb';
      var iconSvg = SVG_ICONS[markerData.kind] || '<div style="width:6px;height:6px;border-radius:50%;background:#fff"></div>';
      var pulseHtml = isSelected ? '<div class="pulse-ring" style="border-color:' + pinColor + '"></div>' : '';

      return L.divIcon({
        className: 'custom-marker' + (isSelected ? ' selected' : ''),
        iconSize: [36, 48],
        iconAnchor: [18, 36],
        popupAnchor: [0, -32],
        html: pulseHtml +
          '<div class="marker-pin" style="background:' + pinColor + '"></div>' +
          '<div class="marker-icon-wrapper">' + iconSvg + '</div>'
      });
    }

    var markersMap = {};
    var currentSelectedId = ${JSON.stringify(selectedId || null)};

    function updateMarkers(markers, selectedId) {
      markerLayer.clearLayers();
      markersMap = {};
      currentSelectedId = selectedId;

      markers.forEach(function(m) {
        var isSelected = m.id === selectedId;
        var marker = L.marker([m.latitude, m.longitude], {
          icon: createMarkerIcon(m, isSelected),
          draggable: !!m.draggable,
          zIndexOffset: isSelected ? 1000 : 0
        });

        marker.on('click', function(e) {
          L.DomEvent.stopPropagation(e);
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'onMarkerClick',
            id: m.id
          }));
        });

        if (m.draggable) {
          marker.on('dragend', function(e) {
            var latLng = e.target.getLatLng();
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'onMapClick',
              latitude: latLng.lat,
              longitude: latLng.lng
            }));
          });
        }

        marker.addTo(markerLayer);
        markersMap[m.id] = marker;
      });
    }

    updateMarkers(${JSON.stringify(markers)}, currentSelectedId);

    map.on('click', function(e) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'onMapClick',
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      }));
    });

    map.on('moveend', function() {
      var center = map.getCenter();
      var bounds = map.getBounds();
      var latDelta = Math.abs(bounds.getNorth() - bounds.getSouth());
      var lngDelta = Math.abs(bounds.getEast() - bounds.getWest());
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'onRegionChange',
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
        zoom: map.getZoom()
      }));
    });

    window.setView = function(lat, lng, zoomLevel) {
      map.setView([lat, lng], zoomLevel || map.getZoom());
    };

    window.setMarkers = function(newMarkers, newSelectedId) {
      updateMarkers(newMarkers, newSelectedId);
    };
  </script>
</body>
</html>
    `;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, interactive]);

  // Sync external region movements
  useEffect(() => {
    const script = `if (window.setView) { window.setView(${region.latitude}, ${region.longitude}, ${zoom}); } true;`;
    webViewRef.current?.injectJavaScript(script);
  }, [region.latitude, region.longitude, zoom]);

  // Sync marker updates efficiently without reloading entire HTML
  useEffect(() => {
    const script = `if (window.setMarkers) { window.setMarkers(${JSON.stringify(markers)}, ${JSON.stringify(selectedId || null)}); } true;`;
    webViewRef.current?.injectJavaScript(script);
  }, [markers, selectedId]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        scrollEnabled={false}
        overScrollMode="never"
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'onMapClick' && onMapClick) {
              onMapClick({ latitude: data.latitude, longitude: data.longitude });
            } else if (data.type === 'onMarkerClick' && onMarkerClick) {
              onMarkerClick(data.id);
            } else if (data.type === 'onRegionChange' && onRegionChange) {
              onRegionChange({
                latitude: data.latitude,
                longitude: data.longitude,
                latitudeDelta: data.latitudeDelta,
                longitudeDelta: data.longitudeDelta,
              });
            }
          } catch {}
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
