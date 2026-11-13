/**
 * Cores de categoria e de marcas externas. Valores fixos (iguais no claro e no escuro) porque
 * servem de marcador/ícone sobre mapa e superfícies; use `colors.*` para qualquer outra coisa.
 */

/** Categorias de chamados do 1746, derivadas do matiz da marca. */
export const categoryPalette = {
  lighting: '#C9971C',
  road: '#C26A2E',
  cleaning: '#3E8E5E',
  traffic: '#B8433F',
  nature: '#5E8C2F',
  drainage: '#2D78A8',
  health: '#A8324D',
  social: '#6A5FA8',
  animals: '#9C6A2B',
  transit: '#2D5A9B',
  general: '#16576C',
} as const;

/** Equipamentos públicos no mapa e nas fichas. */
export const facilityPalette = {
  school: '#98632B',
  health: '#247B83',
  square: '#347453',
} as const;

/** Identidades de terceiros que o app precisa reproduzir fielmente. */
export const partnerBrand = {
  whatsapp: '#25D366',
  whatsappPressed: '#1EBE5D',
  whatsappSurface: '#E7FCEB',
} as const;

export type CategoryKey = keyof typeof categoryPalette;
