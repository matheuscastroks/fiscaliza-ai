/**
 * Fiscaliza aí — Regras de Layout e Superfície (V2)
 */

export const layout = {
  radius: {
    xs: 6,
    sm: 10,
    button: 28,
    card: 28,
    panel: 20,
    sheet: 32,
    pill: 9999,
  },
  borderWidth: {
    hairline: 1,
    focus: 2,
  },
  touchTarget: {
    minHeight: 48,
    minWidth: 48,
  },
} as const;

export type Layout = typeof layout;
