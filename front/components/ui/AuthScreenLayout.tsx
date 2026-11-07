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
import { ThemeToggleButton } from './ThemeToggleButton';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { useTheme } from '@/theme/useTheme';

export function AuthScreenLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
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
    Math.min(160, Math.max(100, Math.round(height * 0.17))),
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
        <View style={[styles.hero, { height: heroHeight }]}>
          <Image
            source={require('@/assets/images/auth-backdrop.jpg')}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
            priority="high"
            accessibilityLabel="Fotografia urbana de cidadãos caminhando na cidade"
          />
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.65)', 'rgba(15, 23, 42, 0.25)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.topBar, { paddingTop: topPadding }]}>
            <View style={styles.brandPill}>
              <AppBrandGlyph size={24} variant="onDark" active />
              <AppText style={[styles.brandTitle, { color: colors.white }]}>
                Fiscaliza{' '}
                <AppText
                  style={[styles.brandTitle, { color: colors.brandYellow }]}
                >
                  aí
                </AppText>
              </AppText>
            </View>
            <ThemeToggleButton />
          </View>
        </View>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, spacing.xl),
            },
          ]}
        >
          <View style={styles.content}>
            <View style={styles.heading}>
              <AppText variant="screenTitle">{title}</AppText>
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
    borderRadius: layout.radius.pill,
  },
  brandTitle: { fontWeight: '700', fontSize: 14 },
  sheet: {
    flex: 1,
    marginTop: -layout.radius.sheet,
    borderTopLeftRadius: layout.radius.sheet,
    borderTopRightRadius: layout.radius.sheet,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  heading: { gap: spacing.xs },
});
