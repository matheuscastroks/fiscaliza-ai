import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppBrandGlyph } from './AppBrandGlyph';
import { AppText } from './AppText';
import { spacing, useTheme } from '@/theme';
import { fontSizes } from '@/theme/typography';

/**
 * Overlay de abertura que anima o SVG da marca (pin + 3 raios amarelos + wordmark)
 * na transição entre a splash nativa do sistema e a tela inicial já montada.
 */
export function AnimatedBrandSplash() {
  const { colors, isDark } = useTheme();
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);

  // Animação de entrada do nome "Fiscaliza"
  const fiscalizaOpacity = useSharedValue(0);
  const fiscalizaTranslateY = useSharedValue(14);
  const fiscalizaScale = useSharedValue(0.92);

  // Animação com pop elástico do acento "aí"
  const aiOpacity = useSharedValue(0);
  const aiScale = useSharedValue(0.35);
  const aiTranslateY = useSharedValue(10);

  // Animação suave da tagline
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(8);

  const dismissSplash = () => {
    if (exiting) return;
    setExiting(true);
    containerOpacity.value = withTiming(0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
    setTimeout(() => {
      setVisible(false);
    }, 260);
  };

  useEffect(() => {
    let mounted = true;
    let exitTimer: ReturnType<typeof setTimeout> | null = null;
    let unmountTimer: ReturnType<typeof setTimeout> | null = null;

    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!mounted) return;
      if (reduced) {
        setVisible(false);
        return;
      }

      // 1. "Fiscaliza" desliza e surge com física suave logo após o 3º traço superior
      fiscalizaOpacity.value = withDelay(580, withTiming(1, { duration: 280 }));
      fiscalizaTranslateY.value = withDelay(
        580,
        withSpring(0, { damping: 15, stiffness: 130 }),
      );
      fiscalizaScale.value = withDelay(
        580,
        withSpring(1, { damping: 15, stiffness: 130 }),
      );

      // 2. "aí" entra no baseline em seguida, completando a marca
      aiOpacity.value = withDelay(700, withTiming(1, { duration: 220 }));
      aiScale.value = withDelay(
        700,
        withSpring(1, { damping: 12, stiffness: 150 }),
      );
      aiTranslateY.value = withDelay(
        700,
        withSpring(0, { damping: 13, stiffness: 140 }),
      );

      // 3. Tagline entra sutilmente na sequência
      taglineOpacity.value = withDelay(820, withTiming(1, { duration: 320 }));
      taglineTranslateY.value = withDelay(
        820,
        withSpring(0, { damping: 15, stiffness: 120 }),
      );

      // Mantém a animação geral ativa por 3,5 segundos no total (~2s estável após a entrada)
      exitTimer = setTimeout(() => {
        if (!mounted) return;
        setExiting(true);
        containerOpacity.value = withTiming(0, {
          duration: 450,
          easing: Easing.out(Easing.cubic),
        });
        containerScale.value = withTiming(1.03, {
          duration: 450,
          easing: Easing.out(Easing.cubic),
        });
      }, 3050);

      unmountTimer = setTimeout(() => {
        if (mounted) setVisible(false);
      }, 3500);
    });

    return () => {
      mounted = false;
      if (exitTimer) clearTimeout(exitTimer);
      if (unmountTimer) clearTimeout(unmountTimer);
    };
  }, [
    aiOpacity,
    aiScale,
    aiTranslateY,
    containerOpacity,
    containerScale,
    fiscalizaOpacity,
    fiscalizaScale,
    fiscalizaTranslateY,
    taglineOpacity,
    taglineTranslateY,
  ]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const fiscalizaStyle = useAnimatedStyle(() => ({
    opacity: fiscalizaOpacity.value,
    transform: [
      { translateY: fiscalizaTranslateY.value },
      { scale: fiscalizaScale.value },
    ],
  }));

  const aiStyle = useAnimatedStyle(() => ({
    opacity: aiOpacity.value,
    transform: [{ translateY: aiTranslateY.value }, { scale: aiScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  if (!visible) return null;

  const accentWordColor = isDark ? colors.brandYellow : colors.onSurfaceBrand;

  return (
    <Animated.View
      pointerEvents={exiting ? 'none' : 'auto'}
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        { backgroundColor: colors.canvas },
        overlayStyle,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Pressable
        onPress={dismissSplash}
        style={styles.pressableContainer}
        accessibilityRole="button"
        accessibilityLabel="Pular tela de abertura"
      >
        <View style={styles.centerBlock}>
          <AppBrandGlyph size={132} active />

          <View style={styles.wordmarkBlock}>
            <View style={styles.titleRow}>
              <Animated.View style={fiscalizaStyle}>
                <AppText style={[styles.wordmark, { color: colors.ink }]}>
                  Fiscaliza{' '}
                </AppText>
              </Animated.View>
              <Animated.View style={aiStyle}>
                <AppText style={[styles.wordmark, { color: accentWordColor }]}>
                  aí
                </AppText>
              </Animated.View>
            </View>

            <Animated.View style={taglineStyle}>
              <AppText variant="caption" color="muted" style={styles.tagline}>
                Seu bairro, em acompanhamento.
              </AppText>
            </Animated.View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 999,
  },
  pressableContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  wordmarkBlock: {
    alignItems: 'center',
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: fontSizes.screenTitle,
    lineHeight: 34,
    fontWeight: '600',
  },
  tagline: {
  },
});
