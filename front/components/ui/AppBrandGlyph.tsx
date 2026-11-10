import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from './AppText';
import { spacing } from '@/theme/spacing';
import { useTheme } from '@/theme/useTheme';
import { fontSizes } from '@/theme/typography';
import { lightColors } from '@/theme/colors';

export type BrandVariant = 'auto' | 'light' | 'dark' | 'onDark' | 'negative';

const PIN_SOURCES = {
  light: require('@/assets/brand/brand-pin.svg'),
  dark: require('@/assets/brand/brand-pin-dark.svg'),
  onDark: require('@/assets/brand/brand-pin-on-dark.svg'),
  negative: require('@/assets/brand/brand-glyph-negative.svg'),
} as const;

const SPARKLE_SOURCES = [
  require('@/assets/brand/brand-sparkle-1.svg'),
  require('@/assets/brand/brand-sparkle-2.svg'),
  require('@/assets/brand/brand-sparkle-3.svg'),
] as const;

export function resolveBrandVariant(
  variant: BrandVariant,
  isDark: boolean,
  color?: string,
): Exclude<BrandVariant, 'auto'> {
  if (variant !== 'auto') return variant;
  if (color && color.toUpperCase() === lightColors.white) return 'onDark';
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

  const dropOffset = Math.max(8, Math.round(size * 0.22));

  // Pin de localização: descida sólida e firme (sem repiques desordenados)
  const pinScale = useSharedValue(reducedMotion ? 1 : 0.88);
  const pinTranslateY = useSharedValue(reducedMotion ? 0 : -dropOffset);
  const pinOpacity = useSharedValue(reducedMotion ? 1 : 0);

  // 3 traços superiores: surgem um a um (sequencial / staggered)
  // Traço 1 (superior vertical)
  const ray1Opacity = useSharedValue(reducedMotion ? 1 : 0);
  const ray1Scale = useSharedValue(reducedMotion ? 1 : 0.4);
  const ray1TranslateX = useSharedValue(reducedMotion ? 0 : -3);
  const ray1TranslateY = useSharedValue(reducedMotion ? 0 : 4);

  // Traço 2 (diagonal intermediário)
  const ray2Opacity = useSharedValue(reducedMotion ? 1 : 0);
  const ray2Scale = useSharedValue(reducedMotion ? 1 : 0.4);
  const ray2TranslateX = useSharedValue(reducedMotion ? 0 : -4);
  const ray2TranslateY = useSharedValue(reducedMotion ? 0 : 4);

  // Traço 3 (lateral direito)
  const ray3Opacity = useSharedValue(reducedMotion ? 1 : 0);
  const ray3Scale = useSharedValue(reducedMotion ? 1 : 0.4);
  const ray3TranslateX = useSharedValue(reducedMotion ? 0 : -4);
  const ray3TranslateY = useSharedValue(reducedMotion ? 0 : 1);

  useEffect(() => {
    if (reducedMotion) {
      pinScale.value = 1;
      pinTranslateY.value = 0;
      pinOpacity.value = 1;

      ray1Opacity.value = 1;
      ray1Scale.value = 1;
      ray1TranslateX.value = 0;
      ray1TranslateY.value = 0;

      ray2Opacity.value = 1;
      ray2Scale.value = 1;
      ray2TranslateX.value = 0;
      ray2TranslateY.value = 0;

      ray3Opacity.value = 1;
      ray3Scale.value = 1;
      ray3TranslateX.value = 0;
      ray3TranslateY.value = 0;
      return;
    }

    if (active) {
      // Estado inicial limpo
      pinScale.value = 0.88;
      pinTranslateY.value = -dropOffset;
      pinOpacity.value = 0;

      ray1Opacity.value = 0;
      ray1Scale.value = 0.4;
      ray1TranslateX.value = -3;
      ray1TranslateY.value = 4;

      ray2Opacity.value = 0;
      ray2Scale.value = 0.4;
      ray2TranslateX.value = -4;
      ray2TranslateY.value = 4;

      ray3Opacity.value = 0;
      ray3Scale.value = 0.4;
      ray3TranslateX.value = -4;
      ray3TranslateY.value = 1;

      // 1. O pin aterrissa com desaceleração precisa e firme
      pinTranslateY.value = withTiming(0, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });
      pinScale.value = withTiming(1, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });
      pinOpacity.value = withTiming(1, { duration: 200 });

      // 2. Traço 1 entra aos 280ms (logo que o pin aterrissa)
      ray1Opacity.value = withDelay(280, withTiming(1, { duration: 180 }));
      ray1Scale.value = withDelay(
        280,
        withSpring(1, { damping: 14, stiffness: 160 }),
      );
      ray1TranslateX.value = withDelay(
        280,
        withSpring(0, { damping: 14, stiffness: 160 }),
      );
      ray1TranslateY.value = withDelay(
        280,
        withSpring(0, { damping: 14, stiffness: 160 }),
      );

      // 3. Traço 2 entra aos 400ms (120ms depois)
      ray2Opacity.value = withDelay(400, withTiming(1, { duration: 180 }));
      ray2Scale.value = withDelay(
        400,
        withSpring(1, { damping: 14, stiffness: 160 }),
      );
      ray2TranslateX.value = withDelay(
        400,
        withSpring(0, { damping: 14, stiffness: 160 }),
      );
      ray2TranslateY.value = withDelay(
        400,
        withSpring(0, { damping: 14, stiffness: 160 }),
      );

      // 4. Traço 3 entra aos 520ms (mais 120ms depois)
      ray3Opacity.value = withDelay(520, withTiming(1, { duration: 180 }));
      ray3Scale.value = withDelay(
        520,
        withSpring(1, { damping: 14, stiffness: 160 }),
      );
      ray3TranslateX.value = withDelay(
        520,
        withSpring(0, { damping: 14, stiffness: 160 }),
      );
      ray3TranslateY.value = withDelay(
        520,
        withSpring(0, { damping: 14, stiffness: 160 }),
      );
    } else {
      pinScale.value = 1;
      pinTranslateY.value = 0;
      pinOpacity.value = 1;

      ray1Opacity.value = 1;
      ray1Scale.value = 1;
      ray1TranslateX.value = 0;
      ray1TranslateY.value = 0;

      ray2Opacity.value = 1;
      ray2Scale.value = 1;
      ray2TranslateX.value = 0;
      ray2TranslateY.value = 0;

      ray3Opacity.value = 1;
      ray3Scale.value = 1;
      ray3TranslateX.value = 0;
      ray3TranslateY.value = 0;
    }
  }, [
    active,
    dropOffset,
    pinOpacity,
    pinScale,
    pinTranslateY,
    ray1Opacity,
    ray1Scale,
    ray1TranslateX,
    ray1TranslateY,
    ray2Opacity,
    ray2Scale,
    ray2TranslateX,
    ray2TranslateY,
    ray3Opacity,
    ray3Scale,
    ray3TranslateX,
    ray3TranslateY,
    reducedMotion,
  ]);

  const animatedPinStyle = useAnimatedStyle(() => ({
    opacity: pinOpacity.value,
    transform: [
      { translateY: pinTranslateY.value },
      { scale: pinScale.value },
    ],
  }));

  const ray1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: ray1Opacity.value,
    transform: [
      { translateX: ray1TranslateX.value },
      { translateY: ray1TranslateY.value },
      { scale: ray1Scale.value },
    ],
  }));

  const ray2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: ray2Opacity.value,
    transform: [
      { translateX: ray2TranslateX.value },
      { translateY: ray2TranslateY.value },
      { scale: ray2Scale.value },
    ],
  }));

  const ray3AnimatedStyle = useAnimatedStyle(() => ({
    opacity: ray3Opacity.value,
    transform: [
      { translateX: ray3TranslateX.value },
      { translateY: ray3TranslateY.value },
      { scale: ray3Scale.value },
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
        <>
          <Animated.View style={[StyleSheet.absoluteFill, ray1AnimatedStyle]}>
            <Image
              source={SPARKLE_SOURCES[0]}
              contentFit="contain"
              style={{ width: size, height: size }}
            />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, ray2AnimatedStyle]}>
            <Image
              source={SPARKLE_SOURCES[1]}
              contentFit="contain"
              style={{ width: size, height: size }}
            />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, ray3AnimatedStyle]}>
            <Image
              source={SPARKLE_SOURCES[2]}
              contentFit="contain"
              style={{ width: size, height: size }}
            />
          </Animated.View>
        </>
      )}
    </View>
  );
}

const LOCKUP_SIZES = {
  sm: { glyph: 22, fontSize: fontSizes.label, lineHeight: 20, gap: spacing.xs },
  md: { glyph: 32, fontSize: fontSizes.sectionTitle, lineHeight: 25, gap: spacing.xs },
  lg: { glyph: 44, fontSize: fontSizes.screenTitle, lineHeight: 32, gap: spacing.sm },
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
    fontWeight: '600',
  },
});
