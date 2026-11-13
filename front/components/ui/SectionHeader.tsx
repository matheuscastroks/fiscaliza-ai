import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import type { IconName } from './IconButton';

export function SectionHeader({
  title,
  action,
  icon,
}: {
  title: string;
  action?: { title: string; onPress: () => void };
  icon?: IconName;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {icon ? <Ionicons name={icon} size={layout.iconSize.sm} color={colors.accent} /> : null}
      <AppText variant="label" color="muted" accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
      {action ? (
        <Pressable accessibilityRole="button" accessibilityLabel={action.title} hitSlop={spacing.sm} onPress={action.onPress}>
          <AppText variant="label" color="accent">{action.title}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs, paddingHorizontal: spacing.xxs },
  title: { flex: 1 },
});
