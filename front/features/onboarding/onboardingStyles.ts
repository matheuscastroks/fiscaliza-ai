import { StyleSheet } from 'react-native';
import { layout, spacing } from '@/theme';
import { fontSizes } from '@/theme/typography';
import { lightColors } from '@/theme/colors';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.contentPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandTextCol: {
    flex: 1,
  },
  brandTitle: {
    fontWeight: '600',
    lineHeight: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  skipPill: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: layout.radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontWeight: '600',
  },
  slideScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.contentPadding,
    paddingVertical: spacing.sm,
  },
  slideLayout: {
    justifyContent: 'center',
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
  },
  heroCard: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    borderRadius: layout.radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
  },
  floatingPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: layout.radius.control,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  floatingPillText: {
    color: lightColors.white,
    fontWeight: '600',
    fontSize: fontSizes.caption,
  },
  stepBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: layout.radius.control,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  stepBadgeText: {
    color: lightColors.white,
    fontWeight: '600',
    fontSize: fontSizes.caption,
  },
  copyBlock: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    gap: spacing.md,
  },
  headingGroup: {
    gap: spacing.xs,
  },
  descriptionText: {
    lineHeight: 21,
  },
  benefitsInsetTable: {
    borderRadius: layout.radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  benefitDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },
  benefitIconSquircle: {
    width: 36,
    height: 36,
    borderRadius: layout.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTextCol: {
    flex: 1,
    gap: 2,
  },
  benefitTitle: {
    fontSize: fontSizes.meta,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: spacing.contentPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    gap: spacing.md,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    height: 8,
    borderRadius: layout.radius.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backCircle: {
    width: 54,
    height: 54,
    borderRadius: layout.radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnWrapper: {
    flex: 1,
  },
});
