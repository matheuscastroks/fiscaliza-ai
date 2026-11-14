import type { MapMarker, MapboxRegion } from '@/components/ui/MapboxMapView';
import { lightColors } from '@/theme/colors';
import { mapPalette } from '@/theme/map';

export function mapboxStyleUrl(isDark = false): string {
  return mapPalette(isDark).styleUrl;
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
          : lightColors.primary;
      features[count++] = {
        type: 'Feature' as const,
        id: m.id,
        properties: {
          id: m.id,
          title: m.title || '',
          color: validColor,
          kind: m.kind || 'official',
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

