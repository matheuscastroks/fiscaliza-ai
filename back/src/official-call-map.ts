import { sql, type SQL } from 'drizzle-orm';
import type { Database } from './db.js';
import { officialCalls } from './schema.js';
import { httpError } from './http-errors.js';

import type { MapViewport, OfficialMapSnapshot } from '../../shared/official-map.js';

/** One database snapshot: counts and bounded spatial cells cover the same filters.
 * No full call payloads or list cursors are involved. The grid has at most 33x33 cells.
 */
export async function queryOfficialMap(db: Database, where: SQL, viewport: MapViewport): Promise<OfficialMapSnapshot> {
  const { north, south, east, west } = viewport;
  if (![north, south, east, west].every(Number.isFinite) || north <= south || east <= west ||
      north > 90 || south < -90 || east > 180 || west < -180) {
    throw httpError(400, 'Área visível do mapa inválida.');
  }
  const latitudeStep = (north - south) / 32;
  const longitudeStep = (east - west) / 32;
  const result = await db.execute<OfficialMapSnapshot>(sql`
    WITH matching AS MATERIALIZED (
      SELECT ${officialCalls.id} AS id, ${officialCalls.latitude} AS latitude,
        ${officialCalls.longitude} AS longitude
      FROM ${officialCalls} WHERE ${where}
    ), located AS (
      SELECT * FROM matching WHERE latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180
    ), visible AS (
      SELECT *, floor((longitude - ${west}) / ${longitudeStep}) AS x,
        floor((latitude - ${south}) / ${latitudeStep}) AS y
      FROM located WHERE latitude BETWEEN ${south} AND ${north} AND longitude BETWEEN ${west} AND ${east}
    ), cells AS (
      SELECT x::text || ':' || y::text AS key, CASE WHEN count(*) = 1 THEN min(id) ELSE NULL END AS id,
        count(*)::int AS count, avg(latitude) AS latitude, avg(longitude) AS longitude,
        max(latitude) AS north, min(latitude) AS south, max(longitude) AS east, min(longitude) AS west
      FROM visible GROUP BY x, y ORDER BY x, y
    )
    SELECT (SELECT count(*)::int FROM matching) AS total,
      (SELECT count(*)::int FROM located) AS "locatedTotal",
      ((SELECT count(*) FROM matching) - (SELECT count(*) FROM located))::int AS "unlocatedTotal",
      (SELECT count(*)::int FROM visible) AS "visibleTotal",
      COALESCE((SELECT json_agg(cells) FROM cells), '[]'::json) AS cells
  `);
  return result.rows[0];
}
