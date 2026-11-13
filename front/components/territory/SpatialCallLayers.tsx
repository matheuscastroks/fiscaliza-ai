import React, { useMemo } from 'react';
import type { OfficialMapCell } from '@/shared/official-map';
import { spatialFeatures } from '@/features/territory/spatialFeatures';
import { mapPalette } from '@/theme/map';

export function SpatialCallLayers({ Mapbox, cells, isDark, onSelect }: {
  Mapbox: Record<string, React.ComponentType<any>>; cells: OfficialMapCell[];
  isDark: boolean; onSelect: (cell: OfficialMapCell) => void;
}) {
  const shape = useMemo(() => spatialFeatures(cells), [cells]);
  const palette = mapPalette(isDark);
  return <Mapbox.ShapeSource id="official-spatial-source" shape={shape}
    onPress={(event: any) => { const cell = event?.features?.[0]?.properties; if (cell) onSelect(cell); }}>
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
