import { StyleSheet } from 'react-native';
import { layout, spacing } from '@/theme';
import { fontSizes } from '@/theme/typography';

export const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  compactContainer: {
    gap: 6,
  },
  compactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactPill: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 6,
    paddingRight: 6,
    paddingVertical: 4,
    borderRadius: layout.radius.control,
    borderWidth: 1,
  },
  compactIconBadge: {
    width: 28,
    height: 28,
    borderRadius: layout.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTitle: {
    flex: 1,
    fontSize: fontSizes.meta,
    fontWeight: '600',
  },
  compactChangeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: layout.radius.control,
  },
  compactChangeText: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
  },
  locationCard: {
    borderRadius: layout.radius.panel,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: layout.radius.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 1,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: layout.radius.control,
  },
  changeText: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
  },
  inlineRadius: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  pendingArea: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.xs,
  },
  sheetContent: {
    paddingHorizontal: spacing.contentPadding,
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollBody: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
  heroScopeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: layout.radius.card,
    borderWidth: 1,
  },
  heroScopeIconBadge: {
    width: 34,
    height: 34,
    borderRadius: layout.radius.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScopeLabel: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
  },
  heroScopeTitle: {
    fontSize: fontSizes.meta,
    fontWeight: '600',
  },
  undoAreaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: layout.radius.control,
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
  sectionHeaderRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionHeaderTitle: {
    fontWeight: '600',
    fontSize: fontSizes.caption,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xxs,
  },
  groupContainer: {
    gap: 6,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  groupHeaderLabel: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
  },
  insetGroupCard: {
    borderRadius: layout.radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  insetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: spacing.sm,
  },
  insetDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
  rowIconBadge: {
    width: 32,
    height: 32,
    borderRadius: layout.radius.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: fontSizes.meta,
    fontWeight: '600',
  },
  rowDesc: {
    fontSize: fontSizes.caption,
  },
  emptyPlacesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: layout.radius.card,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  sheetActions: {
    gap: spacing.xs,
  },
  errorText: {
    paddingHorizontal: spacing.xs,
    fontSize: fontSizes.meta,
  },
  noticeText: {
    paddingHorizontal: spacing.xs,
    fontSize: fontSizes.meta,
  },
});
