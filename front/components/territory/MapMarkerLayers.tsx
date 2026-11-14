import React from 'react';
import { mapPalette } from '@/theme/map';
import type { buildMarkersFeatureCollection } from '@/features/territory/mapboxGeometry';

type Props = {
  Mapbox: Record<string, React.ComponentType<any>>;
  shapeSourceRef: React.Ref<any>;
  markersShape: ReturnType<typeof buildMarkersFeatureCollection>;
  selectedMarkerShape: ReturnType<typeof buildMarkersFeatureCollection> | null;
  handleShapePress: (event: any) => void;
  isDark: boolean;
};
export function MapMarkerLayers({ Mapbox, shapeSourceRef, markersShape, selectedMarkerShape, handleShapePress, isDark }: Props) {
  const palette = mapPalette(isDark);
  return <>
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
              circleColor: palette.cluster,
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
              circleStrokeColor: palette.clusterStroke,
            }}
          />
          <Mapbox.SymbolLayer
            id="clusters-count"
            filter={['has', 'point_count']}
            style={{
              textField: ['get', 'point_count_abbreviated'],
              textSize: 13,
              textColor: palette.clusterText,
              textIgnorePlacement: true,
              textAllowOverlap: true,
            }}
          />
          <Mapbox.CircleLayer
            id="unclustered-point"
            filter={['!', ['has', 'point_count']]}
            style={{
              circleColor: ['get', 'color'],
              circleRadius: 8,
              circleStrokeWidth: 2,
              circleStrokeColor: palette.markerStroke,
            }}
          />
        </Mapbox.ShapeSource>

        {selectedMarkerShape && (
          <Mapbox.ShapeSource
            id="selected-marker-source"
            shape={selectedMarkerShape}
          >
            <Mapbox.CircleLayer
              id="selected-marker-halo"
              style={{
                circleColor: ['get', 'color'],
                circleRadius: 13,
                circleStrokeWidth: 3.5,
                circleStrokeColor: palette.markerStroke,
              }}
            />
          </Mapbox.ShapeSource>
        )}

  </>;
}
