import type { CityOverview, CivicItem, Occurrence } from '../../shared/contracts.js';
import { effectiveTerritory, normalizeNeighborhood } from './civic.js';

type NeighborhoodSummary = CityOverview['neighborhoods'][number] & {
  proposals: number;
  consultations: number;
};

/** Summarizes municipality-owned records without assigning citywide items to a bairro. */
export function summarizeOverview(values: Iterable<Occurrence | CivicItem>): CityOverview {
  const municipalScope = { proposals: 0, consultations: 0, actions: 0 };
  const result: CityOverview = {
    occurrences: 0, resolved: 0, proposals: 0, consultations: 0, actions: 0,
    municipalScope, neighborhoods: [],
  };
  const neighborhoods = new Map<string, NeighborhoodSummary>();
  const neighborhoodRow = (input: string | undefined) => {
    const name = input?.trim().replace(/\s+/g, ' ') || 'Sem bairro informado';
    const key = normalizeNeighborhood(name);
    let row = neighborhoods.get(key);
    if (!row) {
      row = { name, occurrences: 0, resolved: 0, proposals: 0, consultations: 0, actions: 0 };
      neighborhoods.set(key, row);
    }
    return row;
  };
  for (const value of values) {
    if (!('kind' in value)) {
      const row = neighborhoodRow(value.location.neighborhood);
      result.occurrences++;
      row.occurrences++;
      if (value.status === 'resolved') {
        result.resolved++;
        row.resolved++;
      }
      continue;
    }
    const counter = ({ proposal: 'proposals', consultation: 'consultations', action: 'actions' } as const)[value.kind];
    result[counter]++;
    const territory = effectiveTerritory(value);
    if (territory.scope === 'municipality') municipalScope[counter]++;
    else neighborhoodRow(territory.neighborhood)[counter]++;
  }
  result.neighborhoods = [...neighborhoods.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return result;
}
