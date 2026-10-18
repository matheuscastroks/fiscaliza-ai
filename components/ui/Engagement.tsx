import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { layout, spacing } from '@/theme';

export function SupportButton({
  supported,
  disabled,
  onPress,
}: {
  supported: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        supported ? 'Retirar meu apoio' : 'Apoiar este registro'
      }
      aria-pressed={supported}
      accessibilityState={{ selected: supported, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.support, disabled && { opacity: 0.6 }]}
    >
      <Ionicons
        name={supported ? 'heart' : 'heart-outline'}
        size={24}
        color={supported ? colors.risk : colors.ink}
      />
    </Pressable>
  );
}

export function EngagementStats({
  views,
  supports,
  light = false,
}: {
  views: number;
  supports: number;
  light?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const color = light ? colors.white : colors.muted;
  return (
    <View style={styles.row}>
      <View
        style={styles.metric}
        accessibilityLabel={`${views} ${views === 1 ? 'visualização única' : 'visualizações únicas'}`}
      >
        <Ionicons name="eye-outline" size={18} color={color} />
        <AppText variant="meta" style={{ color }}>
          {views} {views === 1 ? 'visualização' : 'visualizações'}
        </AppText>
      </View>
      <View
        style={styles.metric}
        accessibilityLabel={`${supports} ${supports === 1 ? 'apoio' : 'apoios'}`}
      >
        <Ionicons name="heart-outline" size={18} color={color} />
        <AppText variant="meta" style={{ color }}>
          {supports} {supports === 1 ? 'apoio' : 'apoios'}
        </AppText>
      </View>
    </View>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    support: {
      width: layout.touchTarget.minWidth,
      height: layout.touchTarget.minHeight,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    metric: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  });
