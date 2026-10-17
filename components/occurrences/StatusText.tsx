import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Problem } from '@/data/mockData';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { AppText } from '@/components/ui/AppText';
import { getStatusLabel } from '@/utils/occurrenceLabels';

export interface StatusTextProps {
  status: Problem['status'] | string;
  style?: ViewStyle;
}

export const StatusText: React.FC<StatusTextProps> = ({ status, style }) => {
  const label = getStatusLabel(status);

  const getTheme = () => {
    switch (status) {
      case 'resolved':
        return {
          bg: colors.completedSurface,
          text: colors.completed,
          border: colors.completed,
        };
      case 'in_progress':
        return {
          bg: colors.attentionSurface,
          text: colors.attention,
          border: colors.attention,
        };
      case 'pending':
      default:
        return {
          bg: colors.riskSurface,
          text: colors.risk,
          border: colors.risk,
        };
    }
  };

  const theme = getTheme();

  return (
    <View style={[styles.badge, { backgroundColor: theme.bg }, style]}>
      <AppText variant="caption" style={[styles.text, { color: theme.text }]}>
        {label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: layout.radius.xs,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
