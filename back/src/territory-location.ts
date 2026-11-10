import { RIO_MUNICIPALITY_ID } from './constants.js';
import { eq } from 'drizzle-orm';
import type { ReadDatabase } from './db.js';
import { municipalities, territorialBoundaries, dataSources } from './schema.js';
import { containsPoint, territorialError, type Geometry } from './municipality.js';
import { activeBoundaries } from './public-data-repository.js';
import type { TerritoryLocationResolution } from '../../shared/public-data.js';
import { dataVersion } from './response-cache.js';

// As geometrias dos bairros mudam só quando uma camada nova é publicada: ficam
// em memória por versão de dados, em vez de serem lidas a cada requisição.
type BoundaryRow = { id: string; name: string; geometry: Geometry };
let boundaryCache: { version: string; rows: Promise<BoundaryRow[]> } | undefined;

export function resolvePointNeighborhood(point: { latitude: number; longitude: number }, boundaries: { id: string; name: string; geometry: Geometry }[]) {
  const matches = boundaries.filter((row) => containsPoint(row.geometry, point.latitude, point.longitude));
  return matches.length === 1 ? { id: matches[0].id, name: matches[0].name } : null;
}

export async function resolveTerritoryLocation(db: ReadDatabase, point: { latitude: number; longitude: number }): Promise<TerritoryLocationResolution> {
  const [municipality] = await db.select().from(municipalities).where(eq(municipalities.id, RIO_MUNICIPALITY_ID));
  if (!municipality) throw territorialError(503, 'Malha municipal indisponível. Tente novamente.');
  const insideMunicipality = containsPoint(municipality.geometry, point.latitude, point.longitude);
  if (!insideMunicipality) return { municipalityId: RIO_MUNICIPALITY_ID, insideMunicipality: false, neighborhood: null };
  const version = await dataVersion(db);
  if (boundaryCache?.version !== version) {
    const rows = db
      .select({ id: territorialBoundaries.id, name: territorialBoundaries.name, geometry: territorialBoundaries.geometry })
      .from(territorialBoundaries).innerJoin(dataSources, eq(dataSources.id, territorialBoundaries.sourceId)).where(activeBoundaries());
    boundaryCache = { version, rows: Promise.resolve(rows) };
    boundaryCache.rows.catch(() => { boundaryCache = undefined; });
  }
  const boundaries = await boundaryCache!.rows;
  return { municipalityId: RIO_MUNICIPALITY_ID, insideMunicipality, neighborhood: resolvePointNeighborhood(point, boundaries) };
}
