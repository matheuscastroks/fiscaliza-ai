/**
 * Fiscaliza-AI — Adaptador de Cores (compatibilidade com template Expo e Tema V2)
 */
import { colors } from '@/theme/colors';

export const Colors = {
  light: {
    text: colors.ink,
    background: colors.canvas,
    tint: colors.accent,
    icon: colors.muted,
    tabIconDefault: colors.subtle,
    tabIconSelected: colors.accent,
  },
  dark: {
    text: colors.canvas,
    background: colors.ink,
    tint: colors.accentSoft,
    icon: colors.divider,
    tabIconDefault: colors.muted,
    tabIconSelected: colors.accentSoft,
  },
  // Exportação direta dos tokens semânticos V2
  ...colors,
};

export default Colors;
