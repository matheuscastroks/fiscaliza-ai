import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import { fontSizes } from '@/theme/typography';

export function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    officialAction: {
      paddingHorizontal: spacing.contentPadding,
      paddingTop: spacing.sm,
      backgroundColor: colors.canvas,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.md,
    },
    scrollContent: {
      padding: spacing.contentPadding,
      gap: spacing.md,
    },
    officialHeaderBadge: {
      // Ações em cima, título com a largura toda (títulos longos não quebram no meio da palavra).
      flexDirection: 'column',
      alignItems: 'stretch',
    },
    headerTextCol: {
      flex: 1,
      gap: spacing.xxs,
    },
    categoryLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xxs,
    },
    saveButton: {
      width: layout.touchTarget.minWidth,
      height: layout.touchTarget.minHeight,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surfaceSubdued,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.xs,
    },
    actionButton: {
      width: layout.touchTarget.minWidth,
      height: layout.touchTarget.minHeight,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surfaceSubdued,
    },
    protocolPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      marginTop: 2,
    },
    slaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: layout.radius.pill,
      borderWidth: 1,
      marginTop: -spacing.xs,
      marginBottom: spacing.xs,
    },
    slaPillOverdue: {
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    slaPillNormal: {
      backgroundColor: colors.surfaceSubdued,
      borderColor: colors.border,
    },
    slaPillText: {
      fontWeight: '600',
      fontSize: fontSizes.caption,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingBottom: spacing.sm,
    },
    neighborhood: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    sectionCard: {
      paddingVertical: spacing.md,
      gap: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    mainTitle: {
      fontSize: fontSizes.screenTitle,
      lineHeight: 30,
    },
    sectionHeading: {
      fontSize: fontSizes.body,
      marginBottom: spacing.xxs,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      maxWidth: '55%',
      flexShrink: 1,
    },
    statusIndicator: {
      width: 7,
      height: 7,
      borderRadius: layout.radius.xs,
    },
    justificationBox: {
      backgroundColor: colors.surfaceSubdued,
      borderRadius: layout.radius.panel,
      padding: spacing.md,
      gap: 4,
      marginTop: spacing.xs,
    },
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    gridItem: {
      minWidth: '45%',
      flex: 1,
      gap: 2,
    },
    locationSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    mapContainer: {
      marginTop: spacing.sm,
      borderRadius: layout.radius.panel,
      overflow: 'hidden',
    },
    infoCard: {
      gap: spacing.sm,
    },
  });
}
