export type SiurbLayerId = 1 | 2 | 16 | 18;
export interface SiurbLayerSpec {
  id: SiurbLayerId;
  sourceId: string;
  category: 'school' | 'health' | 'square' | 'boundary';
  url: string;
  oid: string;
  nameField: string;
  externalIdField: string;
  fields: readonly string[];
  geometryType: 'esriGeometryPoint' | 'esriGeometryPolygon';
  usage: 'individual' | 'aggregate' | 'unknown';
  usageEvidenceUrl: string;
  attribution: string;
}
export const SIURB_BASE =
  'https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Basicos/Mapa_B%C3%A1sico_H%C3%ADbrido_2024/MapServer';
const definitions = [
  {
    id: 1,
    sourceId: 'siurb-schools',
    category: 'school',
    oid: 'objectid',
    nameField: 'nome_escola',
    externalIdField: 'globalid',
    fields: [
      'objectid',
      'globalid',
      'nome_escola',
      'endereco',
      'cod_bairro',
      'bairro',
      'cod_inep',
      'cod_atividade',
      'telefones',
      'flg_ativa',
    ],
    geometryType: 'esriGeometryPoint',
  },
  {
    id: 2,
    sourceId: 'siurb-health',
    category: 'health',
    oid: 'objectid_1',
    nameField: 'nome',
    externalIdField: 'globalid',
    fields: [
      'objectid_1',
      'globalid',
      'nome',
      'endereco',
      'bairro',
      'telefone',
      'horario_se',
      'horario_sa',
      'tipo_unida',
      'flg_ativo',
      'cnes',
    ],
    geometryType: 'esriGeometryPoint',
  },
  {
    id: 16,
    sourceId: 'siurb-squares',
    category: 'square',
    oid: 'objectid',
    nameField: 'nome_completo',
    externalIdField: 'globalid',
    fields: [
      'objectid',
      'globalid',
      'nome',
      'nome_completo',
      'endereco',
      'bairro',
      'categoria_dom',
      'tipo_espaco',
      'flag_valida',
    ],
    geometryType: 'esriGeometryPolygon',
  },
  {
    id: 18,
    sourceId: 'siurb-neighborhoods',
    category: 'boundary',
    oid: 'objectid',
    nameField: 'nome',
    externalIdField: 'codbairro',
    fields: [
      'objectid',
      'nome',
      'codbairro',
      'codbnum',
      'regiao_adm',
      'area_plane',
    ],
    geometryType: 'esriGeometryPolygon',
  },
] as const;

export function getSiurbLayer(id: SiurbLayerId): SiurbLayerSpec {
  const layer = definitions.find((layer) => layer.id === id);
  if (!layer) throw new Error('Camada SIURB não permitida.');
  return {
    ...layer,
    url: `${SIURB_BASE}/${id}`,
    usage: 'individual',
    usageEvidenceUrl:
      id === 1 || id === 18
        ? `${SIURB_BASE}/${id}/iteminfo?f=json`
        : `${SIURB_BASE}/info/iteminfo?f=json`,
    attribution:
      'Instituto Pereira Passos / Prefeitura da Cidade do Rio de Janeiro',
  };
}
export const SIURB_LAYER_IDS: readonly SiurbLayerId[] = [1, 2, 16, 18];
