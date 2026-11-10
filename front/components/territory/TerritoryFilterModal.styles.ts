import type { ThemeColors } from '@/theme/colors';
import { StyleSheet, Platform } from 'react-native';
import { layout, spacing } from '@/theme';
import { fontSizes } from '@/theme/typography';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    filterModalScroll: {
      flex: 1,
    },
    filterModalBody: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      gap: spacing.md,
    },
    domainTabsTrack: {
      flexDirection: 'row',
      backgroundColor: colors.canvas,
      borderRadius: layout.radius.pill,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    domainTabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: layout.radius.pill,
    },
    domainTabButtonActive: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    domainTabButtonText: {
      fontSize: fontSizes.meta,
      fontWeight: '600',
      color: colors.muted,
    },
    domainTabButtonTextActive: {
      color: colors.ink,
      fontWeight: '600',
    },
    filterFormContainer: {
      gap: spacing.md,
    },
    filterSection: {
      gap: spacing.xs + 2,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    sectionHeaderTitle: {
      fontWeight: '600',
      fontSize: fontSizes.caption,
      color: colors.muted,
    },
    sectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.divider,
      marginVertical: spacing.xxs,
    },
    sectionDesc: {
      fontSize: fontSizes.caption,
      marginTop: -2,
      marginBottom: 2,
    },
    facilityCardsContainer: {
      borderRadius: layout.radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    facilityCardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.surface,
    },
    facilityCardRowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    facilityCardRowSelected: {
      backgroundColor: colors.surfaceSubdued,
    },
    facilityIconBadge: {
      width: 38,
      height: 38,
      borderRadius: layout.radius.panel,
      alignItems: 'center',
      justifyContent: 'center',
    },
    facilityCardTitle: {
      fontSize: fontSizes.meta,
      fontWeight: '600',
      color: colors.ink,
    },
    facilityCardDesc: {
      fontSize: fontSizes.caption,
      color: colors.muted,
    },
    segmentContainer: {
      flexDirection: 'row',
      backgroundColor: colors.canvas,
      borderRadius: layout.radius.pill,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    segmentButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      paddingHorizontal: 8,
      borderRadius: layout.radius.pill,
    },
    segmentButtonActive: {
      backgroundColor: colors.ink,
    },
    segmentText: {
      fontWeight: '600',
      fontSize: fontSizes.caption,
      color: colors.ink,
    },
    segmentTextActive: {
      color: colors.surface,
      fontWeight: '600',
    },
    wrapChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    periodChip: {
      height: 34,
      justifyContent: 'center',
      paddingHorizontal: 14,
      borderRadius: layout.radius.panel,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    periodChipActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    periodChipText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
      color: colors.ink,
    },
    periodChipTextActive: {
      color: colors.surface,
      fontWeight: '600',
    },
    macroThemesTrack: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingVertical: 2,
    },
    macroThemeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 36,
      paddingHorizontal: 12,
      borderRadius: layout.radius.panel,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    macroThemeChipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    macroThemeChipText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
      color: colors.ink,
    },
    macroThemeChipTextSelected: {
      color: colors.onAccent,
      fontWeight: '600',
    },
    modalFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      backgroundColor: colors.surface,
    },
    emptyWarningHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      padding: spacing.sm,
      borderRadius: layout.radius.card,
      backgroundColor: colors.surfaceSubdued,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.xs,
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 48,
      paddingHorizontal: 16,
      borderRadius: layout.radius.panel,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    resetButtonText: {
      fontWeight: '600',
      color: colors.ink,
      fontSize: fontSizes.meta,
    },
    applyButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 48,
      paddingHorizontal: 20,
      borderRadius: layout.radius.panel,
      backgroundColor: colors.accent,
      ...Platform.select({
        ios: {
        },
        android: { },
      }),
    },
    applyButtonText: {
      fontWeight: '600',
      color: colors.onAccent,
      fontSize: fontSizes.meta,
    },
  });
