import type { ThemeColors } from '@/theme/colors';
import { StyleSheet } from 'react-native';
import { layout, spacing } from '@/theme';
import { fontSizes } from '@/theme/typography';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: spacing.contentPadding,
      paddingTop: spacing.xs,
      paddingBottom: 140,
      gap: spacing.lg,
    },
    heroCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: layout.radius.panel,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      gap: spacing.md,
    },
    authPromptRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    avatarContainer: {
      position: 'relative',
    },
    cameraBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 24,
      height: 24,
      borderRadius: layout.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    heroDetails: {
      flex: 1,
      gap: 3,
    },
    heroName: {
      fontSize: fontSizes.sectionTitle,
      fontWeight: '600',
      color: colors.ink,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 5,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: layout.radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      marginTop: 4,
    },
    statusPillText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
    },
    errorAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: spacing.sm,
      borderRadius: layout.radius.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.risk,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    metricCard: {
      flex: 1,
      borderRadius: layout.radius.panel,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 2,
    },
    metricHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    metricIconSquircle: {
      width: 30,
      height: 30,
      borderRadius: layout.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricValue: {
      fontSize: fontSizes.screenTitle,
      fontWeight: '600',
      color: colors.ink,
    },
    metricLabel: {
      fontWeight: '600',
      color: colors.ink,
      fontSize: fontSizes.meta,
      marginTop: 2,
    },
    sectionBlock: {
      gap: 8,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 4,
    },
    sectionHeaderText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
      color: colors.muted,
    },
    insetTable: {
      borderRadius: layout.radius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      minHeight: 54,
    },
    tableRowContent: {
      flex: 1,
      gap: 2,
    },
    flex: {
      flex: 1,
      minWidth: 0,
    },
    versionFooter: {
      textAlign: 'center',
      fontSize: fontSizes.caption,
      marginTop: spacing.xs,
      paddingBottom: spacing.md,
    },
  });
