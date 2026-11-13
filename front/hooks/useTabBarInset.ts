import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';

/**
 * Espaço ocupado pela barra de abas flutuante, medido da base da tela.
 * `barTop`: onde a barra começa (para elementos flutuantes acima dela);
 * `contentInset`: recuo final de listas e rolagens das abas, para o último item não ficar atrás da barra.
 */
export function useTabBarInset() {
  const insets = useSafeAreaInsets();
  const barHeight = layout.tabBar.itemHeight + 2 * layout.tabBar.padding;
  const barTop = insets.bottom + layout.tabBar.bottomGap + barHeight;
  return { barTop, contentInset: barTop + spacing.xl };
}
