import { eq } from 'drizzle-orm';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { municipalities, postalCodes } from './schema.js';
import type { Database } from './db.js';
import type { Municipality, PostalCodeLookup } from '../../shared/contracts.js';
export type Geometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] };
export const territorialError = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode });
// Ring boundary counts as municipal territory, including boundaries of interior holes.
function ringState(
  point: number[],
  ring: number[][],
): 'boundary' | 'inside' | 'outside' {
  let inside = false;
  const [x, y] = point;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[j],
      [bx, by] = ring[i];
    const cross = (x - ax) * (by - ay) - (y - ay) * (bx - ax);
    if (
      Math.abs(cross) < 1e-10 &&
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
export function containsPoint(
  geometry: Geometry,
  latitude: number,
  longitude: number,
): boolean {
  const polygons =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some((rings) => {
    const outer = ringState([longitude, latitude], rings[0]);
    if (outer === 'outside') return false;
    if (outer === 'boundary') return true;
    for (const hole of rings.slice(1)) {
      const state = ringState([longitude, latitude], hole);
      if (state === 'boundary') return true;
      if (state === 'inside') return false;
    }
    return true;
  });
}
export function parseGeometry(value: unknown): Geometry {
  const root = value as any;
  const geometry =
    root?.type === 'FeatureCollection'
      ? root.features?.[0]?.geometry
      : root?.type === 'Feature'
        ? root.geometry
        : root;
  if (!geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type))
    throw territorialError(
      503,
      'Malha municipal indisponível. Tente novamente.',
    );
  const polygons =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  if (
    !Array.isArray(polygons) ||
    !polygons.length ||
    polygons.some(
      (rings: any) =>
        !Array.isArray(rings) ||
        !rings.length ||
        rings.some(
          (ring: any) =>
            !Array.isArray(ring) ||
            ring.length < 4 ||
            ring.some(
              (p: any) =>
                !Array.isArray(p) ||
                p.length < 2 ||
                !Number.isFinite(p[0]) ||
                !Number.isFinite(p[1]) ||
                Math.abs(p[0]) > 180 ||
                Math.abs(p[1]) > 90,
            ) ||
            ring[0][0] !== ring.at(-1)[0] ||
            ring[0][1] !== ring.at(-1)[1],
        ),
    )
  )
    throw territorialError(503, 'Malha municipal inválida. Tente novamente.');
  return geometry;
}
export function municipalityFromGeometry(
  id: string,
  name: string,
  state: string,
  geometry: Geometry,
): Municipality {
  const polygons =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  let north = -90,
    south = 90,
    east = -180,
    west = 180;
  for (const rings of polygons)
    for (const ring of rings)
      for (const [x, y] of ring) {
        north = Math.max(north, y);
        south = Math.min(south, y);
        east = Math.max(east, x);
        west = Math.min(west, x);
      }
  return {
    id,
    name,
    state,
    center: { latitude: (north + south) / 2, longitude: (east + west) / 2 },
    bounds: { north, south, east, west },
  };
}
export async function officialRio() {
  const geometry = parseGeometry(
    JSON.parse(await readFile(resolve('data/3304557.geojson'), 'utf8')),
  );
  return {
    id: '3304557',
    data: municipalityFromGeometry('3304557', 'Rio de Janeiro', 'RJ', geometry),
    geometry,
  };
}
export function municipalityService(
  db: Database,
  fetcher: typeof fetch = fetch,
) {
  async function json(url: string) {
    try {
      const r = await fetcher(url, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error();
      return await r.json();
    } catch {
      throw territorialError(
        503,
        'Consulta territorial indisponível. Seu rascunho foi preservado; tente novamente.',
      );
    }
  }
  async function lookup(input: string): Promise<PostalCodeLookup> {
    const cep = input.replace(/-/g, '');
    if (!/^\d{8}$/.test(cep))
      throw territorialError(400, 'Informe um CEP válido com oito dígitos.');
    const [cached] = await db
      .select()
      .from(postalCodes)
      .where(eq(postalCodes.postalCode, cep));
    if (cached && Date.now() - cached.fetchedAt.getTime() < 30 * 86400000)
      return cached.data;
    const v = (await json(`https://viacep.com.br/ws/${cep}/json/`)) as any;
    if (v?.erro === true || v?.erro === 'true')
      throw territorialError(
        404,
        'CEP não encontrado. Verifique o número informado.',
      );
    if (
      !/^\d{7}$/.test(v?.ibge) ||
      typeof v.localidade !== 'string' ||
      !v.localidade.trim() ||
      !/^[A-Z]{2}$/.test(v.uf) ||
      typeof v.bairro !== 'string' ||
      typeof v.logradouro !== 'string' ||
      typeof v.cep !== 'string' ||
      v.cep.replace(/-/g, '') !== cep
    )
      throw territorialError(503, 'Resposta de CEP inválida. Tente novamente.');
    let [m] = await db
      .select()
      .from(municipalities)
      .where(eq(municipalities.id, v.ibge));
    if (!m) {
      const geometry = parseGeometry(
        await json(
          `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${v.ibge}?formato=application/vnd.geo+json`,
        ),
      );
      const data = municipalityFromGeometry(
        v.ibge,
        v.localidade,
        v.uf,
        geometry,
      );
      await db
        .insert(municipalities)
        .values({ id: v.ibge, data, geometry })
        .onConflictDoNothing();
      [m] = await db
        .select()
        .from(municipalities)
        .where(eq(municipalities.id, v.ibge));
    }
    const data = {
      postalCode: cep,
      municipality: m.data,
      neighborhood: v.bairro,
      street: v.logradouro,
    };
    await db
      .insert(postalCodes)
      .values({ postalCode: cep, data, fetchedAt: new Date() })
      .onConflictDoUpdate({
        target: postalCodes.postalCode,
        set: { data, fetchedAt: new Date() },
      });
    return data;
  }
  return {
    lookup,
    async validatePoint(
      id: string,
      point: { latitude: number; longitude: number },
    ) {
      const [m] = await db
        .select()
        .from(municipalities)
        .where(eq(municipalities.id, id));
      if (!m)
        throw territorialError(
          503,
          'Malha municipal indisponível. Tente novamente.',
        );
      if (!containsPoint(m.geometry, point.latitude, point.longitude))
        throw territorialError(
          400,
          'Selecione um local dentro do município vinculado ao seu perfil.',
        );
    },
  };
}
