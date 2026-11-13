import type { OfficialMapCell } from '@/shared/official-map';
export function spatialFeatures(cells: OfficialMapCell[]) {
  return { type: 'FeatureCollection' as const, features: cells.map(cell => ({
    type: 'Feature' as const, id: cell.key, properties: { ...cell },
    geometry: { type: 'Point' as const, coordinates: [cell.longitude, cell.latitude] },
  })) };
}
