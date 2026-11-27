import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Animated, Easing, Pressable, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/AppText';

import { layout, spacing, useTheme } from '@/theme';

import { fontSizes } from '@/theme/typography';
import { motion } from '@/theme/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const toastEasing = Easing.bezier(...motion.settle);


export interface AppToastProps {
  message: string | null;
  onDismiss?: () => void;
  durationMs?: number;
  topOffset?: number;
  type?: 'info' | 'warning' | 'error';
}

export function AppToast({
  message,
  onDismiss,
  durationMs = 4000,
  topOffset = 110,
  type = 'info',
}: AppToastProps) {
  const { colors, elevation } = useTheme();
  const reducedMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(-motion.toastDistance));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  const animate = useCallback((visible: boolean, onEnd?: () => void) => {
    const nextOpacity = visible ? 1 : 0;
    const nextTranslate = visible || reducedMotion ? 0 : -motion.toastDistance;
    animationRef.current?.stop();
    if (reducedMotion) {
      opacity.setValue(nextOpacity);
      translateY.setValue(nextTranslate);
      onEnd?.();
      return;
    }
    const config = {
      duration: visible ? motion.toastEnterDuration : motion.toastExitDuration,
      easing: toastEasing,
      useNativeDriver: true,
    };
    const transition = Animated.parallel([
      Animated.timing(opacity, { ...config, toValue: nextOpacity }),
      Animated.timing(translateY, { ...config, toValue: nextTranslate }),
    ]);
    animationRef.current = transition;
    transition.start(({ finished }) => {
      if (animationRef.current === transition) animationRef.current = null;
      if (finished) onEnd?.();
    });
  }, [opacity, translateY, reducedMotion]);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    animate(false, () => dismissRef.current?.());
  }, [animate]);

  useEffect(() => {
    if (!message) {
      opacity.setValue(0);
      translateY.setValue(reducedMotion ? 0 : -motion.toastDistance);
      return;
    }
    animate(true);
    timerRef.current = setTimeout(dismiss, durationMs);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      animationRef.current?.stop();
    };
  }, [message, durationMs, animate, dismiss, opacity, translateY, reducedMotion]);

  if (!message) return null;

  const iconName =
    type === 'error'
      ? 'alert-circle'
      : type === 'warning'
      ? 'warning-outline'
      : 'information-circle-outline';

  const iconColor =
    type === 'error'
      ? colors.destructive
      : type === 'warning'
      ? colors.attention
      : colors.ink;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          top: topOffset,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable
        accessibilityRole="alert"
        accessibilityLabel={message}
        onPress={dismiss}
        style={[
          styles.toastCard,
          elevation.floating,
          {
            backgroundColor: colors.surfaceFloating,
          },
        ]}
      >
        <Ionicons name={iconName} size={layout.iconSize.sm} color={iconColor} />
        <AppText
          variant="caption"
          style={[styles.messageText, { color: colors.ink }]}
          numberOfLines={2}
        >
          {message}
        </AppText>
        <Ionicons name="close" size={layout.iconSize.sm} color={colors.muted} />
      </Pressable>
    </Animated.View>
  );
}

const pillRadius = layout?.radius?.pill || 9999;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing?.md || 16,
    right: spacing?.md || 16,
    zIndex: 99,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: pillRadius,
    maxWidth: '92%',
  },
  messageText: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
    flexShrink: 1,
  },
});
