/**
 * Elevação: só existem dois níveis. Superfícies comuns são planas (sem sombra);
 * `floating` é para o que flutua sobre o conteúdo (tab bar, sheets, botões sobre o mapa).
 */
export const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  floating: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
} as const;

export type Elevation = keyof typeof elevation;
