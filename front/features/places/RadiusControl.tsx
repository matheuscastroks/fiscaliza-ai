import React, { useRef, useEffect, useState } from 'react';

import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import * as Haptics from 'expo-haptics';

import { AppText } from '@/components/ui/AppText';

import { layout, useTheme } from '@/theme';

import type { RadiusMeters } from './types';

import { fontSizes } from '@/theme/typography';


export const RADIUS_OPTIONS: { value: RadiusMeters; label: string }[] = [
  { value: 500, label: '500 m' },
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
];

export interface RadiusControlProps {
  value: RadiusMeters;
  onChange: (radius: RadiusMeters) => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function RadiusControl({
  value,
  onChange,
  compact = false,
  style,
}: RadiusControlProps) {
  const { colors, isDark } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  const selectedIndex = Math.max(
    0,
    RADIUS_OPTIONS.findIndex((opt) => opt.value === value)
  );
  const animatedIndex = useRef(new Animated.Value(selectedIndex)).current;

  useEffect(() => {
    Animated.spring(animatedIndex, {
      toValue: selectedIndex,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    }).start();
  }, [selectedIndex, animatedIndex]);

  const pillRadius = layout?.radius?.pill || 9999;
  const padding = 3;
  const itemWidth =
    containerWidth > 0
      ? (containerWidth - padding * 2) / RADIUS_OPTIONS.length
      : 0;

  const translateX = animatedIndex.interpolate({
    inputRange: RADIUS_OPTIONS.map((_, i) => i),
    outputRange: RADIUS_OPTIONS.map((_, i) => i * itemWidth),
  });

  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      {!compact && (
        <AppText variant="caption" color="muted" style={styles.label}>
          Raio de busca ao redor do ponto:
        </AppText>
      )}
      <View
        onLayout={(e) => {
          const w = e.nativeEvent?.layout?.width;
          if (w && Math.abs(w - containerWidth) > 1) {
            setContainerWidth(w);
          }
        }}
        style={[
          styles.pillRow,
          compact && styles.pillRowCompact,
          {
            backgroundColor: colors.surfaceSubdued,
            borderColor: colors.border,
            borderRadius: pillRadius,
          },
        ]}
      >
        {/* Animated sliding background indicator */}
        {containerWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                width: itemWidth,
                backgroundColor: colors.ink,
                borderRadius: pillRadius,
                transform: [{ translateX }],
              },
            ]}
          />
        )}

        {RADIUS_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(opt.value);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Raio de ${opt.label}`}
              style={({ pressed }) => [
                styles.pill,
                compact && styles.pillCompact,
                // Fallback background before onLayout measures width
                containerWidth === 0 &&
                  selected && {
                    backgroundColor: colors.ink,
                    borderRadius: pillRadius,
                  },
                pressed && { opacity: 0.8 },
              ]}
            >
              <AppText
                variant="caption"
                style={[
                  styles.pillText,
                  compact && styles.pillTextCompact,
                  {
                    color: selected ? colors.canvas : colors.muted,
                    fontWeight: selected ? '700' : '600',
                  },
                ]}
              >
                {opt.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const pillRadiusVal = layout?.radius?.pill || 9999;

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  containerCompact: {
    gap: 0,
  },
  label: {
    fontSize: fontSizes.caption,
    fontWeight: '500',
  },
  pillRow: {
    flexDirection: 'row',
    position: 'relative',
    borderRadius: pillRadiusVal,
    padding: 3,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pillRowCompact: {
    height: 38,
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: pillRadiusVal,
  },
  pill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: pillRadiusVal,
    zIndex: 1,
  },
  pillCompact: {
    paddingVertical: 4,
    height: 30,
  },
  pillText: {
    fontSize: fontSizes.meta,
  },
  pillTextCompact: {
    fontSize: fontSizes.caption,
  },
});
