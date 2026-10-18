/**
 * Fiscaliza aí — Adaptador de Cores (compatibilidade com template Expo e Tema V2)
 */
import { lightColors, darkColors } from '@/theme/colors';

const adapt = (palette: typeof darkColors) => ({
  text: palette.ink, background: palette.canvas, tint: palette.accent,
  icon: palette.muted, tabIconDefault: palette.subtle, tabIconSelected: palette.accent,
});
export const Colors = { light: adapt(lightColors), dark: adapt(darkColors), ...lightColors };
export default Colors;
