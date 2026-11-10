import { useTerritoryQueries } from './useTerritoryQueries';
import { useTerritoryView } from './useTerritoryView';

/** Composição dos dois hooks do Explorar; a tela só consome o resultado. */
export function useTerritoryController() {
  const queries = useTerritoryQueries();
  const view = useTerritoryView(queries);
  return { ...queries, ...view };
}
