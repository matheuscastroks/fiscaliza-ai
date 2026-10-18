import type { CivicItem, CivicTerritory, Occurrence } from './contracts.ts';

export function normalizeNeighborhood(value: string): string {
  return value.trim().replace(/\s+/g, ' ').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
}

const municipalityLabels = new Set(['todo o municipio', 'municipio', 'todos os bairros']);

export function civicTerritory(item: Pick<CivicItem, 'neighborhood' | 'territory'>): CivicTerritory {
  if (item.territory) return item.territory;
  const neighborhood = item.neighborhood?.trim().replace(/\s+/g, ' ') || '';
  return !neighborhood || municipalityLabels.has(normalizeNeighborhood(neighborhood))
    ? { scope: 'municipality' }
    : { scope: 'neighborhood', neighborhood };
}

export function matchesNeighborhood(item: CivicItem, selection: string): boolean {
  if (!normalizeNeighborhood(selection)) return true;
  const territory = civicTerritory(item);
  return territory.scope === 'municipality' || normalizeNeighborhood(territory.neighborhood) === normalizeNeighborhood(selection);
}

export function occurrenceMatchesNeighborhood(item: Occurrence, selection: string): boolean {
  return !normalizeNeighborhood(selection) || normalizeNeighborhood(item.location.neighborhood || '') === normalizeNeighborhood(selection);
}

export function neighborhoodOptions(occurrences: Occurrence[], items: CivicItem[], profileNeighborhood?: string): string[] {
  const labels = new Map<string, string>();
  const add = (label?: string) => {
    const clean = label?.trim().replace(/\s+/g, ' ') || '';
    const key = normalizeNeighborhood(clean);
    if (key && !municipalityLabels.has(key) && !labels.has(key)) labels.set(key, clean);
  };
  add(profileNeighborhood);
  occurrences.forEach((item) => add(item.location.neighborhood));
  items.forEach((item) => {
    const territory = civicTerritory(item);
    if (territory.scope !== 'municipality') add(territory.neighborhood);
  });
  return [...labels.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function civicLocation(item: CivicItem): { latitude: number; longitude: number } | undefined {
  const territory = civicTerritory(item);
  if (territory.scope !== 'location') return undefined;
  const { latitude, longitude } = territory.location;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return undefined;
  return { latitude, longitude };
}
