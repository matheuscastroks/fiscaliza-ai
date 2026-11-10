import type { ThemeColors } from '@/theme/colors';
import { StyleSheet } from 'react-native';
import { layout, spacing } from '@/theme';
import { fontSizes } from '@/theme/typography';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    headerContainer: {
      gap: spacing.lg,
      paddingBottom: spacing.sm,
    },
    rankingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    rankPosition: {
      width: 18,
      textAlign: 'center',
      fontWeight: '600',
    },
    rankingContent: {
      flex: 1,
      gap: 4,
    },
    rankingLabel: {
      flex: 1,
      fontWeight: '600',
      paddingRight: 8,
    },
    rankingValue: {
      fontWeight: '600',
    },
    rankingNote: {
      paddingHorizontal: 6,
      lineHeight: 17,
    },
    territoryCapsule: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: layout.radius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    territoryInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingLeft: 4,
    },
    territoryTextCol: {
      flex: 1,
      gap: 1,
    },
    territoryName: {
      fontSize: fontSizes.label,
      fontWeight: '600',
    },
    territoryActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    clearBairroBtn: {
      width: 32,
      height: 32,
      borderRadius: layout.radius.panel,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dashboardBlock: {
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
    },
    heroKpiCard: {
      borderRadius: layout.radius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.md,
      gap: 12,
    },
    heroKpiTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    kpiIconSquircle: {
      width: 38,
      height: 38,
      borderRadius: layout.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroKpiTitleCol: {
      flex: 1,
      gap: 1,
    },
    benchmarkPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: layout.radius.pill,
    },
    heroKpiValueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 12,
    },
    heroKpiNumber: {
      fontSize: fontSizes.screenTitle,
      fontWeight: '600',
      lineHeight: 38,
    },
    heroKpiDetailCol: {
      flex: 1,
      gap: 2,
    },
    secondaryKpiRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    secondaryKpiCard: {
      flex: 1,
      borderRadius: layout.radius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.md,
      gap: 6,
    },
    secondaryKpiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    kpiSmallIcon: {
      width: 32,
      height: 32,
      borderRadius: layout.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryKpiNumber: {
      fontSize: fontSizes.sectionTitle,
      fontWeight: '600',
      lineHeight: 26,
    },
    breakdownBlock: {
      gap: 8,
      marginTop: 4,
    },
    breakdownTable: {
      borderRadius: layout.radius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    breakdownItemRow: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      gap: 6,
    },
    breakdownLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    breakdownStatusLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      paddingRight: 8,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: layout.radius.xs,
    },
    statusLabelText: {
      fontSize: fontSizes.meta,
      fontWeight: '600',
    },
    barTrack: {
      height: 6,
      borderRadius: layout.radius.xs,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: layout.radius.xs,
    },
    listSectionHeader: {
      gap: 10,
      marginTop: 6,
    },
    tableDivider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: 14,
    },
    footerContainer: {
      paddingTop: spacing.md,
      paddingBottom: 40,
      gap: spacing.lg,
    },
    transparencyBlock: {
      gap: 8,
    },
    transparencyTable: {
      borderRadius: layout.radius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    transparencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    transparencyTextCol: {
      flex: 1,
      gap: 2,
    },
  });
