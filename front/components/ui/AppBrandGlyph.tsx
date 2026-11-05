import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/useTheme';

export function AppBrandGlyph({
  size = 20,
  color,
  active = true,
  style,
}: {
  size?: number;
  color?: string;
  active?: boolean;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const glyphColor = color || colors.onAccent;
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

  const pinScale = useSharedValue(reducedMotion ? 1 : 0.85);
  const pinOpacity = useSharedValue(reducedMotion ? 1 : 0.5);
  const sparkleScale = useSharedValue(reducedMotion ? 1 : 0.2);
  const sparkleRotate = useSharedValue(reducedMotion ? 0 : -45);
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
      pinScale.value = 0.85;
      pinOpacity.value = 0.5;
      sparkleScale.value = 0.2;
      sparkleRotate.value = -45;
      sparkleOpacity.value = 0;

      pinScale.value = withSpring(1, { damping: 14, stiffness: 120 });
      pinOpacity.value = withTiming(1, { duration: 250 });

      sparkleScale.value = withSpring(1, { damping: 10, stiffness: 130 });
      sparkleRotate.value = withSpring(0, { damping: 12, stiffness: 120 });
      sparkleOpacity.value = withTiming(1, { duration: 200 });
    } else {
      pinScale.value = 0.85;
      pinOpacity.value = 0.5;
      sparkleScale.value = 0.2;
      sparkleRotate.value = -45;
      sparkleOpacity.value = 0;
    }
  }, [active, reducedMotion, pinOpacity, pinScale, sparkleOpacity, sparkleRotate, sparkleScale]);

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

  const sparkleSize = size * 0.375;
  const sparkleTop = size * (5.5 / 24);
  const sparkleLeft = size * (7.5 / 24);

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
          source={require('@/assets/brand/brand-pin.svg')}
          contentFit="contain"
          tintColor={glyphColor}
          style={{ width: size, height: size }}
        />
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: sparkleSize,
            height: sparkleSize,
            top: sparkleTop,
            left: sparkleLeft,
          },
          animatedSparkleStyle,
        ]}
      >
        <Image
          source={require('@/assets/brand/brand-sparkle.svg')}
          contentFit="contain"
          tintColor={glyphColor}
          style={{ width: sparkleSize, height: sparkleSize }}
        />
      </Animated.View>
    </View>
  );
}
