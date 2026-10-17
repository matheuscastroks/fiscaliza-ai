import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Problem } from '@/data/mockData';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppText } from '@/components/ui/AppText';
import { StatusText } from './StatusText';
import { formatDate } from '@/utils/occurrenceLabels';

export interface OccurrenceRowProps {
  problem: Problem;
  onPress: () => void;
}

export const OccurrenceRow: React.FC<OccurrenceRowProps> = ({ problem, onPress }) => {
  const formattedDate = formatDate(problem.reportedAt);
  const locationText = problem.location?.address || 'Local não especificado';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Ocorrência: ${problem.title}`}
    >
      <View style={styles.contentArea}>
        <View style={styles.topRow}>
          <StatusText status={problem.status} />
          {formattedDate ? (
            <AppText variant="caption" color="muted">
              {formattedDate}
            </AppText>
          ) : null}
        </View>

        <AppText variant="label" color="ink" style={styles.title} numberOfLines={2}>
          {problem.title}
        </AppText>

        <AppText variant="meta" color="muted" numberOfLines={1}>
          {locationText}
        </AppText>
      </View>

      <View style={styles.arrowArea}>
        <MaterialIcons name="chevron-right" size={20} color={colors.subtle} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.contentPadding,
    backgroundColor: colors.surface,
    borderBottomWidth: layout.borderWidth.hairline,
    borderBottomColor: colors.divider,
    minHeight: layout.touchTarget.minHeight,
  },
  contentArea: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  title: {
    marginBottom: spacing.xxs,
  },
  arrowArea: {
    marginLeft: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
