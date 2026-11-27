import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from './colors';
import { darkElevation, lightElevation, type ElevationTokens } from './elevation';

const themes = {
  light: {
    mode: 'light' as const,
    isDark: false,
    colors: lightColors as ThemeColors,
    elevation: lightElevation as ElevationTokens,
  },
  dark: {
    mode: 'dark' as const,
    isDark: true,
    colors: darkColors,
    elevation: darkElevation as ElevationTokens,
  },
};

/** Every consumer receives an explicit reactive value, including under React Compiler. */
export function useTheme() {
  return themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
}

export type ThemedStyleFactory<T> = (colors: ThemeColors, elevation: ElevationTokens) => T;
const styleCache = new WeakMap<
  ThemedStyleFactory<unknown>,
  WeakMap<ThemeColors, unknown>
>();

/** Static factories are evaluated once per palette; hook consumers update without remounting. */
export function useThemedStyles<T>(factory: ThemedStyleFactory<T>): T {
  const { colors, elevation } = useTheme();
  let factoryCache = styleCache.get(factory);
  if (!factoryCache) {
    factoryCache = new WeakMap<ThemeColors, unknown>();
    styleCache.set(factory, factoryCache);
  }
  if (!factoryCache.has(colors)) factoryCache.set(colors, factory(colors, elevation));
  return factoryCache.get(colors) as T;
}
