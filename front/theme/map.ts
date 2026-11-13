import { darkColors, lightColors, type ThemeColors } from './colors';

/** Estilos base do Mapbox: o mapa acompanha o tema do app. */
export const MAPBOX_STYLE_LIGHT = 'mapbox://styles/mapbox/streets-v12';
export const MAPBOX_STYLE_DARK = 'mapbox://styles/mapbox/dark-v11';

export interface MapPalette {
  styleUrl: string;
  /** Fundo enquanto os blocos do mapa carregam. */
  background: string;
  boundary: string;
  cluster: string;
  clusterText: string;
  clusterStroke: string;
  markerStroke: string;
  area: string;
  position: string;
  label: string;
  labelHalo: string;
}

function build(colors: ThemeColors, styleUrl: string): MapPalette {
  return {
    styleUrl,
    background: colors.surfaceSubdued,
    boundary: colors.primary,
    cluster: colors.primary,
    clusterText: colors.onPrimary,
    clusterStroke: colors.canvas,
    markerStroke: colors.white,
    area: colors.ink,
    position: colors.info,
    label: colors.ink,
    labelHalo: colors.surface,
  };
}

const lightMap = build(lightColors, MAPBOX_STYLE_LIGHT);
const darkMap = build(darkColors, MAPBOX_STYLE_DARK);

export function mapPalette(isDark: boolean): MapPalette {
  return isDark ? darkMap : lightMap;
}
