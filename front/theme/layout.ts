/**
 * Fiscaliza aí — Regras de Layout e Superfície (V2)
 */

export const layout = {
  radius: {
    xs: 6,
    sm: 10,
    // Cantos dos controles do mapa são a referência visual do aplicativo.
    control: 20,
    compact: 14,
    avatar: 20,
    button: 20,
    card: 20,
    panel: 20,
    sheet: 24,
    pill: 9999,
  },
  borderWidth: {
    hairline: 1,
    focus: 2,
  },
  /** Tamanhos de ícone permitidos; não use números soltos em `size`. */
  iconSize: {
    sm: 16,
    md: 20,
    lg: 24,
  },
  /** Barra de abas flutuante: altura total e distância da borda inferior segura. */
  tabBar: {
    itemHeight: 48,
    padding: 6,
    bottomGap: 14,
  },
  touchTarget: {
    minHeight: 48,
    minWidth: 48,
  },
} as const;

export type Layout = typeof layout;
