import type {
  publicFacilities,
  territorialBoundaries,
} from '../../territorial-schema.js';
import type { SiurbLayerSpec } from './catalog.js';
import {
  geometryState,
  interiorPoint,
  parseTerritorialGeometry,
} from './geometry.js';
type FacilityRow = typeof publicFacilities.$inferInsert;
type BoundaryRow = typeof territorialBoundaries.$inferInsert;
export type MappingResult =
  | { kind: 'rejected'; reason: string }
  | { kind: 'valid'; type: 'boundary'; value: BoundaryRow }
  | {
      kind: 'valid';
      type: 'facility';
      value: FacilityRow;
      reportedCode: string | null;
      reportedName: string | null;
    };
const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;
export const normalizedName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ');
export const neighborhoodCode = (value: unknown): string | null =>
  /^\d{1,3}$/.test(String(value ?? '')) && Number(value) > 0
    ? String(value).padStart(3, '0')
    : null;
function decoded(
  fields: Record<string, unknown>[],
  name: string,
  value: unknown,
): string | null {
  const domain = fields.find((f) => f.name === name)?.domain as
    | { codedValues?: { code: unknown; name: string }[] }
    | undefined;
  return (
    domain?.codedValues?.find((item) => String(item.code) === String(value))
      ?.name ?? null
  );
}
export function mapSiurbFeature(
  layer: SiurbLayerSpec,
  feature: unknown,
  fields: Record<string, unknown>[] = [],
): MappingResult {
  try {
    const raw = feature as {
      type?: unknown;
      properties?: Record<string, unknown>;
      geometry?: unknown;
    };
    if (raw?.type !== 'Feature' || !raw.properties)
      throw new Error('Feature inválida.');
    const p = raw.properties;
    const name =
      text(p[layer.nameField]) ??
      (layer.category === 'square' ? text(p.nome) : null);
    const geometry = parseTerritorialGeometry(raw.geometry);
    if (layer.category === 'boundary') {
      if (!name) throw new Error('Nome cadastral do bairro ausente.');
      const code = neighborhoodCode(p.codbairro);
      if (
        !code ||
        !geometry ||
        geometry.type === 'Point' ||
        neighborhoodCode(p.codbnum) !== code
      )
        throw new Error('Limite ou código de bairro inválido.');
      return {
        kind: 'valid',
        type: 'boundary',
        value: {
          id: `rio-neighborhood:${code}`,
          municipalityId: '3304557',
          sourceId: layer.sourceId,
          externalId: code,
          name,
          geometry,
          originalData: raw,
        },
      };
    }
    if (
      geometry &&
      (layer.geometryType === 'esriGeometryPoint') !==
        (geometry.type === 'Point')
    )
      throw new Error('Tipo de geometria inválido.');
    const global = text(p.globalid)
      ?.replace(/^\{|\}$/g, '')
      .toLowerCase();
    if (
      global &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
        global,
      )
    )
      throw new Error('GlobalID inválido.');
    if (!Number.isSafeInteger(p[layer.oid]))
      throw new Error('Identificador cadastral inválido.');
    const externalId = global ?? `oid:${p[layer.oid]}`;
    const point =
      geometry?.type === 'Point'
        ? {
            latitude: geometry.coordinates[1],
            longitude: geometry.coordinates[0],
          }
        : geometry
          ? interiorPoint(geometry)
          : null;
    const weekday = text(p.horario_se),
      saturday = text(p.horario_sa);
    const hours =
      [
        weekday ? `Semana: ${weekday}` : null,
        saturday ? `Sábado: ${saturday}` : null,
      ]
        .filter(Boolean)
        .join(' · ') || null;
    const reportedName = text(p.bairro);
    return {
      kind: 'valid',
      type: 'facility',
      reportedCode: neighborhoodCode(
        p.cod_bairro ?? (typeof p.bairro === 'number' ? p.bairro : null),
      ),
      reportedName,
      value: {
        id: `${layer.sourceId}:${externalId}`,
        municipalityId: '3304557',
        externalId,
        sourceId: layer.sourceId,
        category: layer.category,
        name,
        address: text(p.endereco),
        phone: text(p.telefones ?? p.telefone),
        openingHours: hours,
        activity: decoded(fields, 'flg_ativa', p.flg_ativa),
        facilityType:
          decoded(fields, 'cod_atividade', p.cod_atividade) ??
          text(p.tipo_unida) ??
          decoded(fields, 'categoria_dom', p.categoria_dom),
        neighborhoodName: reportedName,
        neighborhoodId: null,
        latitude: point?.latitude ?? null,
        longitude: point?.longitude ?? null,
        geometry,
        originalData: raw,
      },
    };
  } catch (error) {
    return {
      kind: 'rejected',
      reason: error instanceof Error ? error.message : 'Cadastro inválido.',
    };
  }
}
export function resolveFacilityNeighborhood(
  item: Extract<MappingResult, { type: 'facility' }>,
  boundaries: (typeof territorialBoundaries.$inferSelect)[],
  aliases: ReadonlyMap<string, string> = new Map(),
): typeof territorialBoundaries.$inferSelect | null {
  const { latitude, longitude } = item.value;
  if (latitude == null || longitude == null) {
    const matches = boundaries.filter(
      (b) =>
        (item.reportedCode &&
          aliases.get(item.reportedCode) === b.id &&
          (!item.reportedName ||
            normalizedName(b.name) === normalizedName(item.reportedName))) ||
        (b.externalId === item.reportedCode &&
          item.reportedName &&
          normalizedName(b.name) === normalizedName(item.reportedName)),
    );
    return matches.length === 1 ? matches[0] : null;
  }
  const states = boundaries.map((boundary) => ({
    boundary,
    state: geometryState(boundary.geometry, latitude, longitude),
  }));
  if (states.some((item) => item.state === 'boundary')) return null;
  const inside = states.filter((item) => item.state === 'inside');
  if (inside.length !== 1) return null;
  const found = inside[0].boundary;
  if (item.reportedCode && item.reportedCode !== found.externalId) return null;
  if (
    item.reportedName &&
    normalizedName(item.reportedName) !== normalizedName(found.name)
  )
    return null;
  return found;
}
