import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing } from '@/theme/spacing';
import { AppText } from './AppText';

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { title: string; onPress: () => void };
}) {
  return (
    <View style={styles.row}>
      <AppText variant="label" color="muted" accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
      {action ? (
        <Pressable accessibilityRole="button" accessibilityLabel={action.title} hitSlop={spacing.xs} onPress={action.onPress}>
          <AppText variant="label" color="accent">{action.title}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingHorizontal: spacing.xxs },
  title: { flex: 1 },
});
