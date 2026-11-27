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
  errorText: {
    paddingHorizontal: spacing.xs,
    fontSize: fontSizes.meta,
  },
  noticeText: {
    paddingHorizontal: spacing.xs,
    fontSize: fontSizes.meta,
  },
});
