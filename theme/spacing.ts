/**
 * Fiscaliza-AI — Escala de Espaçamento (V2)
 * Espaçamentos funcionais baseados na grade de 4pt.
 */

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,

  // Alias semânticos
  contentPadding: 16,
  gutter: 16,
  rowGap: 12,
  sectionGap: 24,
} as const;

export type Spacing = typeof spacing;
