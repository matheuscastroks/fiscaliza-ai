import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { useTheme } from '@/theme/useTheme';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';

export function AppErrorMessage({
  message,
  title = 'Não foi possível concluir',
  onRetry,
}: {
  message: string;
  title?: string;
  onRetry?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.container, { backgroundColor: colors.riskSurface }]}
    >
      <View style={styles.row}>
        <Ionicons
          name="alert-circle-outline"
          size={24}
          color={colors.risk}
          accessible={false}
        />
        <View style={styles.text}>
          <AppText variant="label" color="risk">
            {title}
          </AppText>
          <AppText color="ink">{message}</AppText>
        </View>
      </View>
      {onRetry && (
        <AppButton
          title="Tentar novamente"
          variant="secondary"
          onPress={onRetry}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    borderRadius: layout.radius.panel,
    padding: spacing.md,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  text: { flex: 1, minWidth: 0, gap: spacing.xs },
});
