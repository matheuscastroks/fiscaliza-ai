/**
 * Classificação temática dos tipos de serviço do 1746, compartilhada entre o
 * aplicativo (apresentação) e a API (filtro de macrotema na consulta).
 */

export type ServiceThemeId =
  | 'lighting'
  | 'road'
  | 'cleaning'
  | 'traffic'
  | 'nature'
  | 'drainage'
  | 'health'
  | 'social'
  | 'animals'
  | 'transit'
  | 'general';

/** Macrotemas oferecidos como filtro de chamados. */
export const MACRO_THEME_IDS = [
  'road',
  'lighting',
  'cleaning',
  'nature',
  'drainage',
  'traffic',
] as const satisfies readonly ServiceThemeId[];

export type MacroThemeId = (typeof MACRO_THEME_IDS)[number];

export function isMacroThemeId(value: unknown): value is MacroThemeId {
  return (
    typeof value === 'string' &&
    (MACRO_THEME_IDS as readonly string[]).includes(value)
  );
}

const RULES: [ServiceThemeId, string[]][] = [
  ['lighting', ['ilumina', 'poste', 'lâmpada']],
  [
    'road',
    [
      'estacionamento',
      'veículo',
      'paviment',
      'buraco',
      'asfalto',
      'vias públicas',
    ],
  ],
  [
    'cleaning',
    ['limpeza', 'lixo', 'remoção', 'entulho', 'coleta', 'contêiner', 'caçamba'],
  ],
  ['traffic', ['semáforo', 'sinal', 'trânsito', 'multa']],
  ['nature', ['árvore', 'arbóreo', 'ambiente', 'mata']],
  ['drainage', ['drenagem', 'esgoto', 'saneamento', 'alagamento', 'bueiro']],
  ['health', ['saúde', 'clínica', 'hospital', 'sisreg', 'remédio']],
  ['animals', ['animal', 'cão', 'gato', 'roedor', 'caramujo']],
  ['transit', ['ônibus', 'brt', 'transporte']],
  [
    'social',
    [
      'cadastro único',
      'social',
      'cidadão',
      'sossego',
      'alvará',
      'iptu',
      'obra',
    ],
  ],
];

export function resolveServiceThemeId(
  serviceType?: string | null,
  serviceSubtype?: string | null,
): ServiceThemeId {
  const combined = `${serviceType || ''} ${serviceSubtype || ''}`.toLowerCase();
  for (const [id, keywords] of RULES) {
    if (keywords.some((keyword) => combined.includes(keyword))) return id;
  }
  return 'general';
}

/** Tipos de serviço (sem considerar subtipo) que pertencem ao macrotema. */
export function serviceTypesForTheme(
  serviceTypes: readonly string[],
  themeId: MacroThemeId,
): string[] {
  return serviceTypes.filter(
    (type) => resolveServiceThemeId(type, null) === themeId,
  );
}
