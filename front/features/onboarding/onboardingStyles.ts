import { StyleSheet } from 'react-native';
import { layout, spacing } from '@/theme';

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
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
  },
  copyBlock: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    gap: spacing.md,
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
