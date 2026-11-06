import { eq } from 'drizzle-orm';
import type { ReadDatabase } from './db.js';
import { municipalities, territorialBoundaries, dataSources } from './schema.js';
import { containsPoint, territorialError, type Geometry } from './municipality.js';
import { activeBoundaries } from './public-data-repository.js';
import type { TerritoryLocationResolution } from '../../shared/public-data.js';

export function resolvePointNeighborhood(point: { latitude: number; longitude: number }, boundaries: { id: string; name: string; geometry: Geometry }[]) {
  const matches = boundaries.filter((row) => containsPoint(row.geometry, point.latitude, point.longitude));
  return matches.length === 1 ? { id: matches[0].id, name: matches[0].name } : null;
}

export async function resolveTerritoryLocation(db: ReadDatabase, point: { latitude: number; longitude: number }): Promise<TerritoryLocationResolution> {
  const [municipality] = await db.select().from(municipalities).where(eq(municipalities.id, '3304557'));
  if (!municipality) throw territorialError(503, 'Malha municipal indisponível. Tente novamente.');
  const insideMunicipality = containsPoint(municipality.geometry, point.latitude, point.longitude);
  if (!insideMunicipality) return { municipalityId: '3304557', insideMunicipality: false, neighborhood: null };
  const boundaries = await db.select({ id: territorialBoundaries.id, name: territorialBoundaries.name, geometry: territorialBoundaries.geometry })
    .from(territorialBoundaries).innerJoin(dataSources, eq(dataSources.id, territorialBoundaries.sourceId)).where(activeBoundaries());
  return { municipalityId: '3304557', insideMunicipality, neighborhood: resolvePointNeighborhood(point, boundaries) };
}
