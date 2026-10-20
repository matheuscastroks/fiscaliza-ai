import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  color?: string;
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
    }
    .marker-pin {
      width: 26px;
      height: 26px;
      border-radius: 50% 50% 50% 0;
      background: #0070f3;
      position: absolute;
      transform: rotate(-45deg);
      left: 50%;
      top: 50%;
      margin: -13px 0 0 -13px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      border: 2px solid #ffffff;
    }
    .marker-dot {
      width: 8px;
      height: 8px;
      background: #ffffff;
      border-radius: 50%;
      position: absolute;
      left: 50%;
      top: 50%;
      margin: -4px 0 0 -4px;
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

    function createMarkerIcon(color) {
      var pinColor = color || '#2563eb';
      return L.divIcon({
        className: 'custom-marker',
        iconSize: [30, 42],
        iconAnchor: [15, 30],
        popupAnchor: [0, -28],
        html: '<div class="marker-pin" style="background:' + pinColor + '"></div><div class="marker-dot"></div>'
      });
    }

    var markersMap = {};

    function updateMarkers(markers) {
      markerLayer.clearLayers();
      markersMap = {};
      markers.forEach(function(m) {
        var marker = L.marker([m.latitude, m.longitude], {
          icon: createMarkerIcon(m.color),
          draggable: !!m.draggable
        });

        if (m.title || m.description) {
          var popupContent = '<div style="font-family:sans-serif;font-size:12px;">' +
            (m.title ? '<strong>' + m.title + '</strong><br/>' : '') +
            (m.description ? m.description : '') +
            '</div>';
          marker.bindPopup(popupContent);
        }

        marker.on('click', function() {
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

    updateMarkers(${JSON.stringify(markers)});

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

    window.setMarkers = function(newMarkers) {
      updateMarkers(newMarkers);
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
    const script = `if (window.setMarkers) { window.setMarkers(${JSON.stringify(markers)}); } true;`;
    webViewRef.current?.injectJavaScript(script);
  }, [markers]);

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
