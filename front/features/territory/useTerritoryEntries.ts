import { useMemo } from 'react';
import { chooseTerritorialEntries } from './selectors';
import { summarizeFacilityPagination } from './facilityPagination';
import { entryLocation, entryToMarker, type Entry } from '@/components/territory/TerritoryPreviewCard';
import type { MapMarker } from '@/components/ui/MapboxMapView';
import type { useTerritoryQueries } from './useTerritoryQueries';

type Queries = Pick<ReturnType<typeof useTerritoryQueries>, 'officialCalls' | 'schools' | 'health' | 'squares' | 'layers' | 'neighborhood' | 'neighborhoodId' | 'areaOnly' | 'selectedId' | 'focusedCallQuery' | 'facilityQueries' | 'selectedCluster'>;

/** Deriva lista, seleção e marcadores a partir do mesmo recorte e das páginas carregadas. */
export function useTerritoryEntries(q: Queries) {
  const { officialCalls, schools, health, squares, layers, neighborhood, neighborhoodId, areaOnly, selectedId, focusedCallQuery, facilityQueries, selectedCluster } = q;
  const entries = useMemo<Entry[]>(() => {
    const calls = officialCalls.data?.calls || [];
    const facilities = [schools.data, health.data, squares.data].flatMap(
      (data) => data?.pages.flatMap((p) => p.items) || [],
    );
    return chooseTerritorialEntries(calls, facilities, layers, {
      neighborhood: areaOnly ? undefined : neighborhood,
      neighborhoodId: areaOnly ? undefined : neighborhoodId,
    });
  }, [
    officialCalls.data?.calls, schools.data, health.data, squares.data,
    layers, neighborhood, neighborhoodId, areaOnly,
  ]);

  const unlocated = useMemo(() => entries.filter((entry) => !entryLocation(entry)), [entries]);
  const located = useMemo(() => entries.filter((entry) => Boolean(entryLocation(entry))), [entries]);
  const listed = areaOnly ? located : entries;

  const selectedEntry = useMemo<Entry | null>(() => {
    if (!selectedId) return null;
    const fromEntries = entries.find((entry) => entry.item.id === selectedId);
    if (fromEntries) return fromEntries;
    const off = officialCalls.data?.calls?.find((item) => item.id === selectedId);
    if (off) return { type: 'official' as const, item: off };
    if (
      focusedCallQuery.data &&
      (focusedCallQuery.data.id === selectedId ||
        focusedCallQuery.data.externalId === selectedId)
    ) {
      return { type: 'official' as const, item: focusedCallQuery.data };
    }
    return null;
  }, [selectedId, entries, officialCalls.data?.calls, focusedCallQuery.data]);

  const activeFacilityQueries = useMemo(() => {
    const labels = { school: 'escolas', health: 'serviços de saúde', square: 'praças' } as const;
    return (['school', 'health', 'square'] as const)
      .filter((cat) => layers.includes(cat))
      .map((cat) => {
        const query = facilityQueries[cat];
        return {
          category: cat,
          query,
          label: labels[cat],
          loaded: query.data?.pages.flatMap((p) => p.items).length ?? 0,
          total: query.data?.pages[0]?.total ?? null,
          hasNextPage: Boolean(query.hasNextPage),
          isFetchingNextPage: Boolean(query.isFetchingNextPage),
          fetchNextPage: () => { void query.fetchNextPage(); },
        };
      });
  }, [layers, facilityQueries]);

  const facilityPagination = useMemo(
    () => summarizeFacilityPagination(activeFacilityQueries),
    [activeFacilityQueries],
  );
  const totalFacilitiesKnown = facilityPagination?.totalKnown ?? null;

  const selectedClusterEntries = useMemo<Entry[]>(() => {
    if (!selectedCluster || selectedCluster.ids.length === 0) return [];
    const idSet = new Set(selectedCluster.ids);
    return entries.filter((entry) => idSet.has(entry.item.id));
  }, [selectedCluster, entries]);

  const totalCalls = officialCalls.data?.total ?? listed.length;
  const hasMoreCalls = Boolean(officialCalls.hasNextPage);
  const dataReady = layers.includes('official')
    ? officialCalls.data !== undefined
    : activeFacilityQueries.length > 0 &&
      activeFacilityQueries.every(
        (query) => query.query.data !== undefined || query.query.isError,
      );

  const mapMarkers: MapMarker[] = useMemo(() => {
    return located.map(entryToMarker).filter((m): m is MapMarker => m !== null);
  }, [located]);

  const allMapMarkers = useMemo(() => {
    if (!selectedEntry || mapMarkers.some((m) => m.id === selectedEntry.item.id)) {
      return mapMarkers;
    }
    const extra = entryToMarker(selectedEntry);
    return extra ? [...mapMarkers, extra] : mapMarkers;
  }, [mapMarkers, selectedEntry]);

  return { entries, unlocated, located, listed, selectedEntry, activeFacilityQueries,
    facilityPagination, totalFacilitiesKnown, selectedClusterEntries, totalCalls, hasMoreCalls, dataReady, allMapMarkers };
}
