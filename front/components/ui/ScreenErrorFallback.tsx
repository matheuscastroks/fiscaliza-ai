import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { useTheme } from '@/theme/useTheme';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';

/**
 * Tela de recuperação para erro de renderização. Fica fora dos provedores do
 * app (pode ser a raiz que falhou), então usa só tema e componentes simples.
 */
export function ScreenErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]} accessibilityRole="alert">
      <Ionicons name="alert-circle-outline" size={layout.iconSize.lg} color={colors.risk} />
      <AppText variant="sectionTitle" accessibilityRole="header">
        Algo deu errado nesta tela
      </AppText>
      <AppText color="muted" style={styles.text}>
        Tente de novo. Se continuar, feche e abra o app.
      </AppText>
      <AppButton title="Tentar de novo" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.contentPadding,
    gap: spacing.md,
  },
  text: { textAlign: 'center' },
});
