import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { layout, spacing, useTheme } from '@/theme';
import { fontSizes } from '@/theme/typography';
import { lightColors } from '@/theme/colors';

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
  const { colors, isDark } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(-12));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!message) {
      opacity.setValue(0);
      translateY.setValue(-12);
      return;
    }

    // Smooth entrance
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 16,
        stiffness: 160,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss timer
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -12,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss?.();
      });
    }, durationMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [message, durationMs, onDismiss, opacity, translateY]);

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
        onPress={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          Animated.timing(opacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            onDismiss?.();
          });
        }}
        style={[
          styles.toastCard,
          {
            backgroundColor: isDark ? colors.surfaceSubdued : colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name={iconName} size={15} color={iconColor} />
        <AppText
          variant="caption"
          style={[styles.messageText, { color: colors.ink }]}
          numberOfLines={2}
        >
          {message}
        </AppText>
        <Ionicons name="close" size={13} color={colors.muted} />
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
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: lightColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 6,
    maxWidth: '92%',
  },
  messageText: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
    flexShrink: 1,
  },
});
