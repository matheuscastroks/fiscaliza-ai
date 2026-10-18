import { useEffect } from 'react';
import { useThemeStore, resolveThemeMode } from '@/stores/themeStore';
import { darkColors, lightColors, type ThemeColors } from './colors';

const themes = {
  light: {
    mode: 'light' as const,
    isDark: false,
    colors: lightColors as ThemeColors,
  },
  dark: { mode: 'dark' as const, isDark: true, colors: darkColors },
};

/** Every consumer receives an explicit reactive value, including under React Compiler. */
export function useTheme() {
  const preference = useThemeStore((state) => state.preference);
  const systemMode = useThemeStore((state) => state.systemMode);
  return themes[resolveThemeMode(preference, systemMode)];
}

/** Call once in RootLayout, before its loading return. Does not remount navigation. */
export function useThemeInitialization() {
  const initialize = useThemeStore((state) => state.initialize);
  const hydrated = useThemeStore((state) => state.hydrated);
  useEffect(() => {
    void initialize();
  }, [initialize]);
  return hydrated;
}

export type ThemedStyleFactory<T> = (colors: ThemeColors) => T;
const styleCache = new WeakMap<
  ThemedStyleFactory<unknown>,
  WeakMap<ThemeColors, unknown>
>();

/** Static factories are evaluated once per palette; hook consumers update without remounting. */
export function useThemedStyles<T>(factory: ThemedStyleFactory<T>): T {
  const { colors } = useTheme();
  let factoryCache = styleCache.get(factory);
  if (!factoryCache) {
    factoryCache = new WeakMap<ThemeColors, unknown>();
    styleCache.set(factory, factoryCache);
  }
  if (!factoryCache.has(colors)) factoryCache.set(colors, factory(colors));
  return factoryCache.get(colors) as T;
}
