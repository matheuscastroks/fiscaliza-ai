import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { OfficialCallsQueryParams } from '@/shared/contracts';
import type { MapViewport } from '@/shared/official-map';
import type { MapboxRegion, MapRegionChange } from '@/components/ui/MapboxMapView';
import { fetchOfficialMap } from '@/services/officialCalls';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export function useSpatialCalls(params: OfficialCallsQueryParams, enabled: boolean, scope: string, initial: MapboxRegion) {
  const [viewport, setViewport] = useState<MapViewport>({
    north: initial.latitude + (initial.latitudeDelta ?? 0.4) / 2,
    south: initial.latitude - (initial.latitudeDelta ?? 0.4) / 2,
    east: initial.longitude + (initial.longitudeDelta ?? 0.55) / 2,
    west: initial.longitude - (initial.longitudeDelta ?? 0.55) / 2,
  });
  const settled = useDebouncedValue(viewport, 450);
  const setSpatialViewport = useCallback((region: MapRegionChange) => {
    const bounds = region.visibleBounds ?? {
      north: region.latitude + region.latitudeDelta / 2, south: region.latitude - region.latitudeDelta / 2,
      east: region.longitude + region.longitudeDelta / 2, west: region.longitude - region.longitudeDelta / 2,
    };
    setViewport(previous => JSON.stringify(previous) === JSON.stringify(bounds) ? previous : bounds);
  }, []);
  const query = useQuery({
    queryKey: ['officialCallMap', scope, params, settled],
    queryFn: ({ signal }) => fetchOfficialMap({ ...params, viewNorth: settled.north, viewSouth: settled.south, viewEast: settled.east, viewWest: settled.west }, signal),
    enabled, staleTime: 30_000,
  });
  return { spatialMap: query, setSpatialViewport };
}
