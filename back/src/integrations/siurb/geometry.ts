import type { TerritorialGeometry } from '../../../../shared/contracts.js';
export type AreaGeometry = Exclude<TerritorialGeometry, { type: 'Point' }>;
type State = 'inside' | 'outside' | 'boundary';
const position = (p: unknown): p is number[] =>
  Array.isArray(p) &&
  p.length >= 2 &&
  p.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
  Math.abs(p[0]) <= 180 &&
  Math.abs(p[1]) <= 90;
const closedRing = (r: unknown): r is number[][] =>
  Array.isArray(r) &&
  r.length >= 4 &&
  r.every(position) &&
  r[0][0] === r[r.length - 1][0] &&
  r[0][1] === r[r.length - 1][1];
function ring(r: unknown): r is number[][] {
  if (!closedRing(r)) return false;
  const [x, y] = r[0];
  let area = 0;
  for (let i = 1; i < r.length; i++)
    area +=
      (r[i - 1][0] - x) * (r[i][1] - y) - (r[i][0] - x) * (r[i - 1][1] - y);
  return area !== 0;
}
const polygon = (p: unknown): p is number[][][] =>
  Array.isArray(p) && p.length > 0 && p.every(ring);
export function parseTerritorialGeometry(
  value: unknown,
): TerritorialGeometry | null {
  if (value === null) return null;
  if (!value || typeof value !== 'object')
    throw new Error('Geometria inválida.');
  const g = value as { type?: unknown; coordinates?: unknown };
  if (
    (g.type === 'Point' && position(g.coordinates)) ||
    (g.type === 'Polygon' && polygon(g.coordinates)) ||
    (g.type === 'MultiPolygon' &&
      Array.isArray(g.coordinates) &&
      g.coordinates.length > 0 &&
      g.coordinates.every(polygon))
  )
    return value as TerritorialGeometry;
  throw new Error('Geometria inválida.');
}
function ringState(ring: number[][], x: number, y: number): State {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[j],
      [bx, by] = ring[i];
    if (
      Math.abs((x - ax) * (by - ay) - (y - ay) * (bx - ax)) < 1e-10 &&
      x >= Math.min(ax, bx) - 1e-10 &&
      x <= Math.max(ax, bx) + 1e-10 &&
      y >= Math.min(ay, by) - 1e-10 &&
      y <= Math.max(ay, by) + 1e-10
    )
      return 'boundary';
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax)
      inside = !inside;
  }
  return inside ? 'inside' : 'outside';
}
export function geometryState(
  g: AreaGeometry,
  latitude: number,
  longitude: number,
): State {
  const polygons = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  let boundary = false;
  for (const rings of polygons) {
    const outer = ringState(rings[0], longitude, latitude);
    if (outer === 'boundary') {
      boundary = true;
      continue;
    }
    if (outer === 'outside') continue;
    const holes = rings.slice(1).map((r) => ringState(r, longitude, latitude));
    if (holes.includes('boundary')) {
      boundary = true;
      continue;
    }
    if (!holes.includes('inside')) return 'inside';
  }
  return boundary ? 'boundary' : 'outside';
}
export function interiorPoint(
  g: AreaGeometry,
): { latitude: number; longitude: number } | null {
  const polygons = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const rings of polygons) {
    let west = Infinity,
      east = -Infinity,
      south = Infinity,
      north = -Infinity;
    for (const [x, y] of rings[0]) {
      west = Math.min(west, x);
      east = Math.max(east, x);
      south = Math.min(south, y);
      north = Math.max(north, y);
    }
    const middle = {
      latitude: (south + north) / 2,
      longitude: (west + east) / 2,
    };
    if (geometryState(g, middle.latitude, middle.longitude) === 'inside')
      return middle;
    for (let i = 0; i < 32; i++)
      for (let j = 0; j < 32; j++) {
        const point = {
          latitude: south + ((north - south) * (i + 0.5)) / 32,
          longitude: west + ((east - west) * (j + 0.5)) / 32,
        };
        if (geometryState(g, point.latitude, point.longitude) === 'inside')
          return point;
      }
  }
  return null;
}
