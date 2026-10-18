import { useTheme } from '@/theme/useTheme';

export function useColorScheme() {
  return useTheme().mode;
}
