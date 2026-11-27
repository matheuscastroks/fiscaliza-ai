import type { ThemeColors } from '@/theme/colors';
import type { ElevationTokens } from '@/theme/elevation';
import { StyleSheet } from 'react-native';
import { layout, spacing } from '@/theme';

export const createStyles = (colors: ThemeColors, elevation?: ElevationTokens) =>
  StyleSheet.create({
    filterModalScroll: { flex: 1 },
    filterModalBody: {
      paddingHorizontal: spacing.contentPadding,
      paddingTop: spacing.xs,
    },
    filterFormContainer: { gap: spacing.lg },
    filterSection: { gap: spacing.xs },
    facilityCardsContainer: {
      gap: spacing.xxs,
      padding: spacing.xxs,
      borderRadius: layout.radius.card,
      backgroundColor: colors.surfaceRecessed,
      ...elevation?.recessed,
    },
    facilityCardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: layout.touchTarget.minHeight,
      padding: spacing.sm,
      borderRadius: layout.radius.panel,
    },
    facilityCardRowSelected: {
      backgroundColor: colors.surfaceRaised,
      ...elevation?.subtle,
    },
    segmentContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: colors.surfaceRecessed,
      borderRadius: layout.radius.control,
      padding: spacing.xxs,
      gap: spacing.xxs,
      ...elevation?.recessed,
    },
    segmentButton: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: layout.touchTarget.minHeight,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: layout.radius.compact,
    },
    segmentButtonActive: {
      backgroundColor: colors.surfaceRaised,
      ...elevation?.subtle,
    },
    segmentText: { color: colors.muted, fontWeight: '600', textAlign: 'center' },
    segmentTextActive: { color: colors.primary },
    periodTrack: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    modalFooter: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.xs,
      paddingHorizontal: spacing.contentPadding,
      paddingTop: spacing.sm,
      backgroundColor: colors.surfaceRaised,
      ...elevation?.subtle,
    },
    confirmButton: { flexGrow: 1 },
  });
