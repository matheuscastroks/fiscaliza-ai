import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from './AppText';
import { spacing } from '@/theme/spacing';
import { useTheme } from '@/theme/useTheme';

export type BrandVariant = 'auto' | 'light' | 'dark' | 'onDark' | 'negative';

const PIN_SOURCES = {
  light: require('@/assets/brand/brand-pin.svg'),
  dark: require('@/assets/brand/brand-pin-dark.svg'),
  onDark: require('@/assets/brand/brand-pin-on-dark.svg'),
  negative: require('@/assets/brand/brand-glyph-negative.svg'),
} as const;

const SPARKLE_SOURCE = require('@/assets/brand/brand-sparkle.svg');

export function resolveBrandVariant(
  variant: BrandVariant,
  isDark: boolean,
  color?: string,
): Exclude<BrandVariant, 'auto'> {
  if (variant !== 'auto') return variant;
  if (color && color.toUpperCase() === '#FFFFFF') return 'onDark';
  return isDark ? 'dark' : 'light';
}

export function AppBrandGlyph({
  size = 24,
  color,
  variant = 'auto',
  active = true,
  style,
}: {
  size?: number;
  color?: string;
  variant?: BrandVariant;
  active?: boolean;
  style?: ViewStyle;
}) {
  const { isDark } = useTheme();
  const resolvedVariant = resolveBrandVariant(variant, isDark, color);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const pinScale = useSharedValue(reducedMotion ? 1 : 0.88);
  const pinOpacity = useSharedValue(reducedMotion ? 1 : 0.6);
  const sparkleScale = useSharedValue(reducedMotion ? 1 : 0.72);
  const sparkleRotate = useSharedValue(reducedMotion ? 0 : -10);
  const sparkleOpacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      pinScale.value = 1;
      pinOpacity.value = 1;
      sparkleScale.value = 1;
      sparkleRotate.value = 0;
      sparkleOpacity.value = 1;
      return;
    }

    if (active) {
      pinScale.value = 0.88;
      pinOpacity.value = 0.6;
      sparkleScale.value = 0.72;
      sparkleRotate.value = -10;
      sparkleOpacity.value = 0;

      pinScale.value = withSpring(1, { damping: 14, stiffness: 120 });
      pinOpacity.value = withTiming(1, { duration: 250 });

      sparkleScale.value = withSpring(1, { damping: 10, stiffness: 130 });
      sparkleRotate.value = withSpring(0, { damping: 12, stiffness: 120 });
      sparkleOpacity.value = withTiming(1, { duration: 200 });
    } else {
      pinScale.value = 0.88;
      pinOpacity.value = 0.6;
      sparkleScale.value = 0.72;
      sparkleRotate.value = -10;
      sparkleOpacity.value = 0;
    }
  }, [
    active,
    reducedMotion,
    pinOpacity,
    pinScale,
    sparkleOpacity,
    sparkleRotate,
    sparkleScale,
  ]);

  const animatedPinStyle = useAnimatedStyle(() => ({
    opacity: pinOpacity.value,
    transform: [{ scale: pinScale.value }],
  }));

  const animatedSparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
    transform: [
      { scale: sparkleScale.value },
      { rotate: `${sparkleRotate.value}deg` },
    ],
  }));

  const pinSource = PIN_SOURCES[resolvedVariant];

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Fiscaliza aí"
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedPinStyle]}>
        <Image
          source={pinSource}
          contentFit="contain"
          style={{ width: size, height: size }}
        />
      </Animated.View>
      {resolvedVariant !== 'negative' && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedSparkleStyle]}>
          <Image
            source={SPARKLE_SOURCE}
            contentFit="contain"
            style={{ width: size, height: size }}
          />
        </Animated.View>
      )}
    </View>
  );
}

const LOCKUP_SIZES = {
  sm: { glyph: 22, fontSize: 15, lineHeight: 20, gap: spacing.xs },
  md: { glyph: 32, fontSize: 20, lineHeight: 25, gap: spacing.xs },
  lg: { glyph: 44, fontSize: 26, lineHeight: 32, gap: spacing.sm },
} as const;

export function AppBrandLockup({
  size = 'md',
  showTagline = false,
  variant = 'auto',
  active = true,
  style,
}: {
  size?: keyof typeof LOCKUP_SIZES;
  showTagline?: boolean;
  variant?: BrandVariant;
  active?: boolean;
  style?: ViewStyle;
}) {
  const { colors, isDark } = useTheme();
  const resolved = resolveBrandVariant(variant, isDark);
  const metrics = LOCKUP_SIZES[size];

  const mainWordColor =
    resolved === 'onDark' || resolved === 'negative'
      ? colors.white
      : colors.ink;
  const accentWordColor =
    resolved === 'negative'
      ? colors.white
      : resolved === 'onDark' || resolved === 'dark'
        ? colors.brandYellow
        : colors.onSurfaceBrand;
  const taglineColor =
    resolved === 'onDark' || resolved === 'negative'
      ? 'rgba(255, 255, 255, 0.82)'
      : colors.muted;

  return (
    <View
      style={[styles.lockupRow, { gap: metrics.gap }, style]}
      accessibilityRole="header"
      accessibilityLabel={
        showTagline
          ? 'Fiscaliza aí. Seu bairro, em acompanhamento.'
          : 'Fiscaliza aí'
      }
    >
      <AppBrandGlyph
        size={metrics.glyph}
        variant={resolved}
        active={active}
      />
      <View style={styles.lockupTextCol}>
        <AppText
          numberOfLines={1}
          style={[
            styles.wordmark,
            {
              fontSize: metrics.fontSize,
              lineHeight: metrics.lineHeight,
              color: mainWordColor,
            },
          ]}
        >
          Fiscaliza{' '}
          <AppText
            style={[
              styles.wordmark,
              {
                fontSize: metrics.fontSize,
                lineHeight: metrics.lineHeight,
                color: accentWordColor,
              },
            ]}
          >
            aí
          </AppText>
        </AppText>
        {showTagline && (
          <AppText
            variant="caption"
            numberOfLines={1}
            style={{ color: taglineColor }}
          >
            Seu bairro, em acompanhamento.
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lockupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockupTextCol: {
    flexShrink: 1,
    justifyContent: 'center',
  },
  wordmark: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
