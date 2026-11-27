import { type ReactNode, useCallback } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBrandGlyph } from './AppBrandGlyph';
import { AppText } from './AppText';
import { KeyboardAwareScrollView } from './KeyboardAwareScrollView';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { useTheme } from '@/theme/useTheme';
import { fontSizes } from '@/theme/typography';
import { darkElevation } from '@/theme/elevation';

export function AuthScreenLayout({
  title,
  description,
  children,
  expandPhoto = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  expandPhoto?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const topPadding = Math.max(insets.top, 16) + spacing.xs;
  const heroHeight = Math.max(
    topPadding +
      layout.touchTarget.minHeight +
      layout.radius.sheet +
      spacing.xxs,
    Math.min(184, Math.max(100, Math.round(height * 0.23))),
  );
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle(isDark ? 'light' : 'dark');
    }, [isDark]),
  );
  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <KeyboardAwareScrollView
        bottomOffset={32}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={[styles.hero, { height: heroHeight, flexGrow: expandPhoto ? 1 : 0 }]}>
          <Image
            source={require('@/assets/images/auth-backdrop.jpg')}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
            priority="high"
            accessible={false}
          />
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.65)', 'rgba(15, 23, 42, 0.25)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.topBar, { paddingTop: topPadding }]}>
            <View style={[styles.brandPill, darkElevation.subtle]}>
              <AppBrandGlyph size={24} variant="onDark" active />
              <AppText numberOfLines={1} style={[styles.brandTitle, { color: colors.white }]}>
                Fiscaliza{' '}
                <AppText
                  style={[styles.brandTitle, { color: colors.brandYellow }]}
                >
                  aí
                </AppText>
              </AppText>
            </View>
          </View>
        </View>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              flexGrow: expandPhoto ? 0 : 1,
              paddingBottom: Math.max(insets.bottom, spacing.xl),
            },
          ]}
        >
          <View style={styles.content}>
            <View style={styles.heading}>
              <AppText variant="screenTitle" accessibilityRole="header">{title}</AppText>
              <AppText color="muted">{description}</AppText>
            </View>
            {children}
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: { width: '100%', overflow: 'hidden' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: layout.radius.control,
  },
  brandTitle: { fontWeight: '600', fontSize: fontSizes.meta },
  sheet: {
    marginTop: -layout.radius.sheet,
    borderTopLeftRadius: layout.radius.sheet,
    borderTopRightRadius: layout.radius.sheet,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  heading: { gap: spacing.xs },
});
