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
  selectedClusterIds?: string[] | null;
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
  onMarkerClick?: (id: string) => void;
  onClusterClick?: (event: {
    ids: string[];
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

export function OsmMapView({
  style,
  region,
  markers = [],
  selectedId,
  selectedClusterIds,
  onMapClick,
  onMarkerClick,
  onClusterClick,
  onRegionChange,
  interactive = true,
  isDark = false,
}: OsmMapViewProps) {
  const webViewRef = useRef<WebView>(null);
  const lastCenterRef = useRef<{
    latitude: number;
    longitude: number;
    zoom?: number;
  }>({
    latitude: region.latitude,
    longitude: region.longitude,
    zoom: region.zoom,
  });
  const lastMarkersJsonRef = useRef<string>('');

  const zoom = useMemo(() => {
    if (region.zoom) return region.zoom;
    const delta = Math.max(region.latitudeDelta || 0.05, region.longitudeDelta || 0.05, 0.001);
    return Math.max(3, Math.min(18, Math.round(Math.log2(360 / delta))));
  }, [region.zoom, region.latitudeDelta, region.longitudeDelta]);

  const htmlContent = useMemo(() => {
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution = '&copy; OpenStreetMap contributors';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
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
    ${isDark ? `
    .leaflet-tile-pane {
      filter: invert(100%) hue-rotate(180deg) brightness(92%) contrast(92%);
    }
    .leaflet-container {
      background: #121212 !important;
    }
    ` : ''}
    .leaflet-control-attribution {
      font-size: 8px !important;
      background: rgba(255,255,255,0.7) !important;
    }
    .custom-marker-wrapper {
      background: transparent !important;
      border: none !important;
    }
    .pin-stage {
      position: relative;
      width: 44px;
      height: 52px;
      transform-origin: 22px 46px;
      transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
      cursor: pointer;
    }
    .pin-stage:active {
      transform: scale(0.94);
    }
    .pin-stage.selected {
      transform: scale(1.18) translateY(-2px);
    }
    .pin-svg {
      display: block;
      width: 44px;
      height: 52px;
      filter: drop-shadow(0 4px 8px rgba(17, 19, 21, 0.28)) drop-shadow(0 1px 2px rgba(17, 19, 21, 0.18));
    }
    .pin-stage.selected .pin-svg {
      filter: drop-shadow(0 8px 14px rgba(17, 19, 21, 0.38)) drop-shadow(0 2px 4px rgba(17, 19, 21, 0.22));
    }
    .pulse-ring {
      position: absolute;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: 2.5px solid #212529;
      top: 0px;
      left: 1px;
      animation: pulse 1.8s infinite ease-out;
      pointer-events: none;
      box-sizing: border-box;
    }
    @keyframes pulse {
      0% { transform: scale(0.78); opacity: 0.9; }
      100% { transform: scale(1.38); opacity: 0; }
    }
    .custom-cluster-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 20px;
      background: #212529;
      color: #ffffff;
      font-weight: 800;
      font-size: 13px;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.3px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      box-shadow: 0 0 0 3px rgba(33, 37, 41, 0.2), 0 5px 12px rgba(17, 19, 21, 0.32);
      border: 2.5px solid #ffffff;
      cursor: pointer;
      transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
      box-sizing: border-box;
    }
    .custom-cluster-badge:active {
      transform: scale(0.94);
    }
    .custom-cluster-badge.selected {
      transform: scale(1.14);
      border-color: #ffffff;
      box-shadow: 0 0 0 5px rgba(33, 37, 41, 0.45), 0 8px 18px rgba(17, 19, 21, 0.42);
    }
    .custom-cluster-badge.medium {
      width: 46px;
      height: 46px;
      border-radius: 23px;
      font-size: 14px;
    }
    .custom-cluster-badge.large {
      width: 52px;
      height: 52px;
      border-radius: 26px;
      font-size: 15px;
    }
    .cluster-icon-wrapper {
      background: transparent !important;
      border: none !important;
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

    var isProgrammaticMove = false;
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
      minZoom: 10,
      maxZoom: 19,
      dragging: ${interactive},
      touchZoom: ${interactive},
      scrollWheelZoom: ${interactive},
      doubleClickZoom: ${interactive}
    }).setView([${region.latitude}, ${region.longitude}], ${zoom});

    L.tileLayer('${tileUrl}', {
      maxZoom: 19,
      attribution: '${attribution}'
    }).addTo(map);

    var markersMap = {};
    var currentSelectedId = ${JSON.stringify(selectedId || null)};
    var currentSelectedClusterIds = ${JSON.stringify(selectedClusterIds || [])};

    var clusterGroup;
    if (typeof L.markerClusterGroup === 'function') {
      clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 45,
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: false,
        disableClusteringAtZoom: 16,
        iconCreateFunction: function(cluster) {
          var count = cluster.getChildCount();
          var childMarkers = cluster.getAllChildMarkers();
          var isClusterSelected = false;
          if (currentSelectedClusterIds && currentSelectedClusterIds.length > 0) {
            isClusterSelected = childMarkers.some(function(m) {
              return currentSelectedClusterIds.indexOf(m.markerId) !== -1;
            });
          }
          var sizeClass = count >= 50 ? 'large' : count > 10 ? 'medium' : 'small';
          var iconDim = count >= 50 ? 52 : count > 10 ? 46 : 40;
          return L.divIcon({
            html: '<div class="custom-cluster-badge ' + (isClusterSelected ? 'selected ' : '') + sizeClass + '"><span>' + count + '</span></div>',
            className: 'cluster-icon-wrapper',
            iconSize: L.point(iconDim, iconDim),
            iconAnchor: L.point(iconDim / 2, iconDim / 2)
          });
        }
      });
      clusterGroup.on('clusterclick', function(c) {
        var childMarkers = c.layer.getAllChildMarkers();
        var count = childMarkers.length;
        if (count > 10 && map.getZoom() < 15) {
          postAppMessage({
            type: 'onMapClick',
            latitude: c.latlng.lat,
            longitude: c.latlng.lng
          });
          c.layer.zoomToBounds({ padding: [48, 48] });
          return;
        }
        var ids = childMarkers.map(function(m) { return m.markerId; });
        postAppMessage({
          type: 'onClusterClick',
          ids: ids,
          latitude: c.latlng.lat,
          longitude: c.latlng.lng
        });
      });
    } else {
      clusterGroup = L.layerGroup();
    }
    map.addLayer(clusterGroup);

    var SVG_ICONS = {
      occurrence: '<path d="M10.45 4.15L3.35 16.45C2.68 17.62 3.52 19.08 4.87 19.08H19.13C20.48 19.08 21.32 17.62 20.65 16.45L13.55 4.15C12.87 2.98 11.13 2.98 10.45 4.15ZM12 8.5C12.6 8.5 13.1 9.0 13.1 9.6V12.8C13.1 13.4 12.6 13.9 12 13.9C11.4 13.9 10.9 13.4 10.9 12.8V9.6C10.9 9.0 11.4 8.5 12 8.5ZM12 17.0C11.34 17.0 10.8 16.46 10.8 15.8C10.8 15.14 11.34 14.6 12 14.6C12.66 14.6 13.2 15.14 13.2 15.8C13.2 16.46 12.66 17.0 12 17.0Z" fill="#FFFFFF"/>',
      proposal: '<path d="M12 2.5C8.13 2.5 5 5.63 5 9.5C5 11.88 6.19 13.97 8 15.24V17.5C8 18.05 8.45 18.5 9 18.5H15C15.55 18.5 16 18.05 16 17.5V15.24C17.81 13.97 19 11.88 19 9.5C19 5.63 15.87 2.5 12 2.5ZM9.5 20C9.5 20.83 10.17 21.5 11 21.5H13C13.83 21.5 14.5 20.83 14.5 20V19.5H9.5V20Z" fill="#FFFFFF"/>',
      consultation: '<path d="M18 3H6C4.34 3 3 4.34 3 6V18C3 19.66 4.34 21 6 21H18C19.66 21 21 19.66 21 18V6C21 4.34 19.66 3 18 3ZM10.6 16.2L6.8 12.4C6.41 12.01 6.41 11.38 6.8 10.99C7.19 10.6 7.82 10.6 8.21 10.99L10.6 13.38L15.79 8.19C16.18 7.8 16.81 7.8 17.2 8.19C17.59 8.58 17.59 9.21 17.2 9.6L10.6 16.2Z" fill="#FFFFFF"/>',
      action: '<path d="M21.71 18.29L14.3 10.88C15.08 8.76 14.62 6.27 12.91 4.56C11.05 2.7 8.21 2.34 5.95 3.43L9.5 6.98L7.02 9.46L3.47 5.91C2.36 8.17 2.73 11.01 4.59 12.87C6.3 14.58 8.79 15.04 10.91 14.26L18.32 21.67C18.79 22.14 19.55 22.14 20.02 21.67L21.71 19.98C22.18 19.51 22.18 18.76 21.71 18.29Z" fill="#FFFFFF"/>'
    };

    function createMarkerIcon(markerData, isSelected) {
      var pinColor = markerData.color || '#212529';
      var iconPath = SVG_ICONS[markerData.kind] || '<circle cx="12" cy="12" r="5" fill="#FFFFFF"/>';
      var pulseHtml = isSelected ? '<div class="pulse-ring" style="border-color:' + pinColor + '"></div>' : '';

      return L.divIcon({
        className: 'custom-marker-wrapper',
        iconSize: [44, 52],
        iconAnchor: [22, 46],
        popupAnchor: [0, -42],
        html:
          '<div class="pin-stage' + (isSelected ? ' selected' : '') + '">' +
            pulseHtml +
            '<svg class="pin-svg" width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">' +
              '<ellipse cx="22" cy="46.5" rx="6" ry="2.2" fill="rgba(17, 19, 21, 0.24)" />' +
              '<path d="M22 5.5C30.5604 5.5 37.5 12.4396 37.5 21C37.5 26.42 34.72 31.19 30.5 33.96L23.62 44.38C22.84 45.56 21.16 45.56 20.38 44.38L13.5 33.96C9.28 31.19 6.5 26.42 6.5 21C6.5 12.4396 13.4396 5.5 22 5.5Z" fill="' + pinColor + '" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round" />' +
              '<circle cx="22" cy="21" r="11.2" fill="rgba(255, 255, 255, 0.15)" />' +
              '<g transform="translate(13.36, 12.36) scale(0.72)">' +
                iconPath +
              '</g>' +
            '</svg>' +
          '</div>'
      });
    }

    function updateMarkers(markers, selectedId, clusterIds) {
      clusterGroup.clearLayers();
      markersMap = {};
      currentSelectedId = selectedId;
      currentSelectedClusterIds = clusterIds || [];

      var leafletMarkers = [];
      markers.forEach(function(m) {
        var isSelected = m.id === selectedId;
        var marker = L.marker([m.latitude, m.longitude], {
          icon: createMarkerIcon(m, isSelected),
          draggable: !!m.draggable,
          zIndexOffset: isSelected ? 1000 : 0
        });
        marker.markerId = m.id;

        marker.on('click', function(e) {
          L.DomEvent.stopPropagation(e);
          postAppMessage({
            type: 'onMarkerClick',
            id: m.id
          });
        });

        if (m.draggable) {
          marker.on('dragend', function(e) {
            var latLng = e.target.getLatLng();
            postAppMessage({
              type: 'onMapClick',
              latitude: latLng.lat,
              longitude: latLng.lng
            });
          });
        }

        leafletMarkers.push(marker);
        markersMap[m.id] = marker;
      });

      if (clusterGroup.addLayers) {
        clusterGroup.addLayers(leafletMarkers);
      } else {
        leafletMarkers.forEach(function(mk) { clusterGroup.addLayer(mk); });
      }
    }

    updateMarkers(${JSON.stringify(markers)}, currentSelectedId, currentSelectedClusterIds);

    map.on('click', function(e) {
      postAppMessage({
        type: 'onMapClick',
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      });
    });

    map.on('moveend', function() {
      if (isProgrammaticMove) {
        return;
      }
      var center = map.getCenter();
      var bounds = map.getBounds();
      var latDelta = Math.abs(bounds.getNorth() - bounds.getSouth());
      var lngDelta = Math.abs(bounds.getEast() - bounds.getWest());
      postAppMessage({
        type: 'onRegionChange',
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
        zoom: map.getZoom()
      });
    });

    window.setView = function(lat, lng, zoomLevel) {
      isProgrammaticMove = true;
      map.setView([lat, lng], zoomLevel || map.getZoom(), { animate: false });
      setTimeout(function() {
        isProgrammaticMove = false;
      }, 300);
    };

    window.setMarkers = function(newMarkers, newSelectedId, newClusterIds) {
      updateMarkers(newMarkers, newSelectedId, newClusterIds);
    };
  </script>
</body>
</html>
    `;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, interactive]);

  // Sync external region movements (ignoring internal move echoes)
  useEffect(() => {
    const last = lastCenterRef.current;
    const currentTargetZoom = region.zoom ?? zoom;

    const isSameLat = Math.abs(region.latitude - last.latitude) < 0.0001;
    const isSameLng = Math.abs(region.longitude - last.longitude) < 0.0001;
    const isSameZoom =
      last.zoom !== undefined
        ? Math.abs(currentTargetZoom - last.zoom) < 0.2
        : false;

    if (isSameLat && isSameLng && isSameZoom) {
      return;
    }

    lastCenterRef.current = {
      latitude: region.latitude,
      longitude: region.longitude,
      zoom: currentTargetZoom,
    };

    const script = `if (window.setView) { window.setView(${region.latitude}, ${region.longitude}, ${currentTargetZoom}); } true;`;
    webViewRef.current?.injectJavaScript(script);
  }, [region.latitude, region.longitude, region.zoom, zoom]);

  // Sync marker updates efficiently without reloading entire HTML
  useEffect(() => {
    const payload = JSON.stringify({
      markers,
      selectedId: selectedId || null,
      selectedClusterIds: selectedClusterIds || null,
    });
    if (payload === lastMarkersJsonRef.current) return;
    lastMarkersJsonRef.current = payload;
    const script = `if (window.setMarkers) { window.setMarkers(${JSON.stringify(markers)}, ${JSON.stringify(selectedId || null)}, ${JSON.stringify(selectedClusterIds || [])}); } true;`;
    webViewRef.current?.injectJavaScript(script);
  }, [markers, selectedId, selectedClusterIds]);

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
            } else if (data.type === 'onClusterClick' && onClusterClick) {
              onClusterClick({
                ids: data.ids,
                latitude: data.latitude,
                longitude: data.longitude,
              });
            } else if (data.type === 'onRegionChange' && onRegionChange) {
              lastCenterRef.current = {
                latitude: data.latitude,
                longitude: data.longitude,
                zoom: data.zoom,
              };
              onRegionChange({
                latitude: data.latitude,
                longitude: data.longitude,
                latitudeDelta: data.latitudeDelta,
                longitudeDelta: data.longitudeDelta,
                zoom: data.zoom,
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
