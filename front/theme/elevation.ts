/**
 * Elevação e iluminação direcional (luz de cima para baixo) via `boxShadow` nativo.
 * Níveis: `none`, `recessed` (campos/trilhos côncavos), `subtle` (cards base),
 * `raised` (cards/controles destacados) e `floating` (sheets, tab bar, botões sobre mapa).
 */
export type ElevationLevel = 'none' | 'recessed' | 'subtle' | 'raised' | 'floating';

export function createElevationTokens(isDark: boolean) {
  if (isDark) {
    return {
      none: { boxShadow: 'none' },
      recessed: {
        boxShadow:
          'inset 0 2px 4px rgba(0, 0, 0, 0.45), inset 0 -1px 0 rgba(255, 255, 255, 0.05)',
      },
      subtle: {
        boxShadow:
          'inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 1px 2px rgba(0, 0, 0, 0.35), 0 4px 10px rgba(0, 0, 0, 0.22)',
      },
      raised: {
        boxShadow:
          'inset 0 1px 0 rgba(255, 255, 255, 0.10), 0 2px 4px rgba(0, 0, 0, 0.42), 0 8px 20px rgba(0, 0, 0, 0.28)',
      },
      floating: {
        boxShadow:
          'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 8px rgba(0, 0, 0, 0.48), 0 12px 28px rgba(0, 0, 0, 0.38)',
      },
    } as const;
  }

  return {
    none: { boxShadow: 'none' },
    recessed: {
      boxShadow:
        'inset 0 2px 4px rgba(25, 45, 53, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.85)',
    },
    subtle: {
      boxShadow:
        'inset 0 1px 0 rgba(255, 255, 255, 0.90), 0 1px 2px rgba(25, 45, 53, 0.06), 0 3px 8px rgba(25, 45, 53, 0.05)',
    },
    raised: {
      boxShadow:
        'inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 2px 4px rgba(25, 45, 53, 0.08), 0 8px 18px rgba(25, 45, 53, 0.08)',
    },
    floating: {
      boxShadow:
        'inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 4px 10px rgba(25, 45, 53, 0.12), 0 14px 30px rgba(25, 45, 53, 0.14)',
    },
  } as const;
}

export const lightElevation = createElevationTokens(false);
export const darkElevation = createElevationTokens(true);

export type ElevationTokens = {
  readonly [Key in ElevationLevel]: { readonly boxShadow: string };
};

export const elevation: ElevationTokens = lightElevation;
export type Elevation = ElevationLevel;
