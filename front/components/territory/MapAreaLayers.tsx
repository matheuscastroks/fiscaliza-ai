import type { circleFeature, pointFeature } from '@/features/territory/mapArea';
import { darkColors, lightColors } from '@/theme/colors';

type Circle = ReturnType<typeof circleFeature>;
type Point = ReturnType<typeof pointFeature>;
// SDK is loaded conditionally by MapboxMapView, including on runtimes without RNMBX.
type NativeMapbox = Record<string, React.ComponentType<any>>;

export function MapAreaLayers({ Mapbox, searchCircle, accuracyCircle, isDark = false }: {
  Mapbox: NativeMapbox; searchCircle: Circle; accuracyCircle: Circle; isDark?: boolean;
}) {
  const palette = isDark ? darkColors : lightColors;
  const positionColor = palette.info;
  return <>
    {searchCircle && <Mapbox.ShapeSource id="search-area-source" shape={searchCircle}>
      <Mapbox.FillLayer id="search-area-fill" style={{ fillColor: palette.ink, fillOpacity: 0.055 }} />
      <Mapbox.LineLayer id="search-area-outline" style={{ lineColor: palette.ink, lineWidth: 2, lineOpacity: 0.8, lineDasharray: [3, 2] }} />
    </Mapbox.ShapeSource>}
    {accuracyCircle && <Mapbox.ShapeSource id="device-accuracy-source" shape={accuracyCircle}>
      <Mapbox.FillLayer id="device-accuracy-fill" style={{ fillColor: positionColor, fillOpacity: 0.15 }} />
      <Mapbox.LineLayer id="device-accuracy-outline" style={{ lineColor: positionColor, lineWidth: 1, lineOpacity: 0.35 }} />
    </Mapbox.ShapeSource>}
  </>;
}

export function MapPositionLayers({ Mapbox, centerPoint, devicePoint, isDark = false }: {
  Mapbox: NativeMapbox; centerPoint: Point; devicePoint: Point; isDark?: boolean;
}) {
  const palette = isDark ? darkColors : lightColors;
  return <>
    {centerPoint && <Mapbox.ShapeSource id="search-center-source" shape={centerPoint}>
      <Mapbox.CircleLayer id="search-center-point" style={{ circleColor: palette.ink, circleRadius: 5, circleStrokeColor: palette.white, circleStrokeWidth: 2 }} />
      <Mapbox.SymbolLayer id="search-center-label" style={{ textField: 'Centro da área', textSize: 12, textOffset: [0, 1.2], textAnchor: 'top', textColor: palette.ink, textHaloColor: palette.surface, textHaloWidth: 1.5 }} />
    </Mapbox.ShapeSource>}
    {devicePoint && <Mapbox.ShapeSource id="device-position-source" shape={devicePoint}>
      <Mapbox.CircleLayer id="device-position-point" style={{ circleColor: palette.info, circleRadius: 8, circleStrokeColor: palette.white, circleStrokeWidth: 3 }} />
    </Mapbox.ShapeSource>}
  </>;
}
