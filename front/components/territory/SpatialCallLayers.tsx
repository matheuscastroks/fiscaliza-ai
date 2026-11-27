import React, { useMemo, useRef } from 'react';
import type { ShapeSource } from '@rnmapbox/maps';
import type { Feature } from 'geojson';
import type { OfficialMapCell } from '@/shared/official-map';
import { spatialFeatures, spatialClusterProperties, spatialSelection, type SpatialClusterSelection } from '@/features/territory/spatialFeatures';
import { mapPalette } from '@/theme/map';

export function SpatialCallLayers({ Mapbox, cells, isDark, onSelect, onSelectionError }: {
  Mapbox: Record<string, React.ComponentType<any>>; cells: OfficialMapCell[];
  isDark: boolean; onSelect: (cell: SpatialClusterSelection) => void;
  onSelectionError?: () => void;
}) {
  const source = useRef<ShapeSource>(null);
  const selectionRequest = useRef(0);
  const shape = useMemo(() => spatialFeatures(cells), [cells]);
  const cellsByKey = useMemo(() => new Map(cells.map((cell) => [cell.key, cell])), [cells]);
  const palette = mapPalette(isDark);
  async function selectFeature(feature: Feature | undefined) {
    const request = ++selectionRequest.current;
    if (!feature || feature.geometry.type !== 'Point') return;
    const cell = spatialSelection({ geometry: feature.geometry, properties: feature.properties ?? undefined });
    if (!cell) return;
    if (!feature.properties?.cluster) {
      onSelect(cell);
      return;
    }
    try {
      const collection = await source.current?.getClusterLeaves(feature, cells.length, 0) as
        { features: Feature[] } | undefined;
      if (request !== selectionRequest.current || !source.current) return;
      const members = collection?.features.flatMap((leaf) => {
        const member = cellsByKey.get(leaf.properties?.key);
        return member ? [member] : [];
      }) ?? [];
      if (members.reduce((total, member) => total + member.count, 0) !== cell.count) {
        onSelectionError?.();
        return;
      }
      onSelect({ ...cell, members });
    } catch {
      if (request === selectionRequest.current && source.current) onSelectionError?.();
    }
  }
  return <Mapbox.ShapeSource ref={source} id="official-spatial-source" shape={shape}
    cluster clusterRadius={64} clusterMaxZoomLevel={20} maxZoomLevel={21}
    clusterProperties={spatialClusterProperties}
    onPress={(event: { features?: Feature[] }) => { void selectFeature(event.features?.[0]); }}>
    <Mapbox.CircleLayer id="official-spatial-circles" style={{
      circleColor: palette.cluster, circleStrokeColor: palette.clusterStroke, circleStrokeWidth: 2,
      circleRadius: ['case', ['>', ['get', 'count'], 1], 23, 8],
    }} />
    <Mapbox.SymbolLayer id="official-spatial-counts" filter={['>', ['get', 'count'], 1]} style={{
      textField: ['to-string', ['get', 'count']], textSize: 13, textColor: palette.clusterText,
      textAllowOverlap: true, textIgnorePlacement: true,
    }} />
  </Mapbox.ShapeSource>;
}
