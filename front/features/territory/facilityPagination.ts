export interface FacilityPaginationSource {
  label: string;
  loaded: number;
  total: number | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export interface FacilityPaginationSummary {
  hasMore: boolean;
  isFetchingNextPage: boolean;
  loadedCount: number;
  totalKnown: number | null;
  label: string;
  fetchNextPage: () => void;
}

/**
 * Resume a paginação de várias camadas de equipamentos em um único controle.
 * `totalKnown` só é informado quando todas as camadas ativas publicaram o total.
 */
export function summarizeFacilityPagination(
  sources: readonly FacilityPaginationSource[],
): FacilityPaginationSummary | undefined {
  if (sources.length === 0) return undefined;
  const hasMore = sources.some((source) => source.hasNextPage);
  const isFetchingNextPage = sources.some(
    (source) => source.isFetchingNextPage,
  );
  const loadedCount = sources.reduce((total, source) => total + source.loaded, 0);
  const totalKnown = sources.every((source) => typeof source.total === 'number')
    ? sources.reduce((total, source) => total + (source.total as number), 0)
    : null;
  return {
    hasMore,
    isFetchingNextPage,
    loadedCount,
    totalKnown,
    label: sources.length === 1 ? sources[0].label : 'equipamentos',
    fetchNextPage: () => {
      for (const source of sources) {
        if (source.hasNextPage && !source.isFetchingNextPage) {
          source.fetchNextPage();
        }
      }
    },
  };
}
