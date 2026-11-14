import type { OfficialMapCell } from '@/shared/official-map';
export function spatialFeatures(cells: OfficialMapCell[]) {
  return { type: 'FeatureCollection' as const, features: cells.map(cell => ({
    type: 'Feature' as const, id: cell.key, properties: { ...cell },
    geometry: { type: 'Point' as const, coordinates: [cell.longitude, cell.latitude] },
  })) };
}

/** Native clusters aggregate call counts, rather than the number of server cells. */
export const spatialClusterProperties = {
  count: ['+', ['get', 'count']],
  north: ['max', ['get', 'north']], south: ['min', ['get', 'south']],
  east: ['max', ['get', 'east']], west: ['min', ['get', 'west']],
};

type SpatialFeature = {
  geometry?: { coordinates?: number[] };
  properties?: Partial<OfficialMapCell> & { cluster?: boolean; cluster_id?: number };
};

export function spatialSelection(feature: SpatialFeature | undefined): OfficialMapCell | null {
  const p = feature?.properties;
  if (!p || !p.count) return null;
  if (!p.cluster) return p as OfficialMapCell;
  const coordinates = feature?.geometry?.coordinates;
  if (!coordinates || coordinates.length < 2) return null;
  return {
    key: `cluster:${p.cluster_id}`, id: null, count: p.count,
    longitude: coordinates[0], latitude: coordinates[1],
    north: p.north!, south: p.south!, east: p.east!, west: p.west!,
  };
}
