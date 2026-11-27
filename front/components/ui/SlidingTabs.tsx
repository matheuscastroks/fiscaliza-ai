import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/useTheme';

import { useEffect, useRef, useState } from 'react';

import {
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Ionicons } from '@expo/vector-icons';

import { AppText } from './AppText';

import { AppSelect } from './AppSelect';

import { spacing } from '@/theme';

import { layout } from '@/theme/layout';
import { motion } from '@/theme/motion';


export interface SlidingOption {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const selectionTiming = { duration: motion.selectionDuration, easing: Easing.bezier(...motion.settle) };

/** One moving selection surface; automatically switches to a searchable select when > 5 options. */
export function SlidingTabs({
  options,
  value,
  onChange,
  label,
  scroll = true,
  edgeToEdge = true,
  tabs = false,
  stacked = false,
}: {
  options: readonly SlidingOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  scroll?: boolean;
  edgeToEdge?: boolean;
  tabs?: boolean;
  stacked?: boolean;
}) {
  const { colors, elevation } = useTheme();
  const { width: screenWidth, fontScale } = useWindowDimensions();

  const [positions, setPositions] = useState<
    Record<string, { x: number; width: number }>
  >({});
  const reduced = useReducedMotion();
  const left = useSharedValue(0);
  const width = useSharedValue(0);
  const previous = useRef<{ value: string; screenWidth: number; fontScale: number } | null>(null);
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: left.get() }],
    width: width.get(),
  }));
  const selected = positions[value];
  useEffect(() => {
    if (!selected) return;
    const last = previous.current;
    previous.current = { value, screenWidth, fontScale };
    if (reduced || !last || last.value === value || last.screenWidth !== screenWidth || last.fontScale !== fontScale) {
      left.set(selected.x);
      width.set(selected.width);
      return;
    }
    left.set(withTiming(selected.x, selectionTiming));
    width.set(withTiming(selected.width, selectionTiming));
  }, [selected, value, screenWidth, fontScale, reduced, left, width]);

  if (options.length > 5) {
    return (
      <AppSelect
        label={label}
        options={options}
        value={value}
        onChange={onChange}
        defaultValue={options[0]?.value ?? ''}
      />
    );
  }

  if (stacked || (!scroll && (screenWidth < 390 || fontScale > 1.15))) {
    return (
      <View accessibilityRole={tabs ? 'tablist' : 'radiogroup'} accessibilityLabel={label}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole={tabs ? 'tab' : 'radio'}
              accessibilityState={tabs ? { selected: active } : { checked: active }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => ({
                minHeight: layout.touchTarget.minHeight,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: layout.radius.compact,
                backgroundColor: pressed ? colors.surfaceSubdued : undefined,
              })}
            >
              {option.icon && <Ionicons name={option.icon} size={layout.iconSize.md} color={colors.muted} />}
              <AppText variant="label" style={{ flex: 1 }}>{option.label}</AppText>
              {active && <Ionicons name="checkmark" size={layout.iconSize.md} color={colors.primary} />}
            </Pressable>
          );
        })}
      </View>
    );
  }

  const row = (
    <View
      accessibilityRole={tabs ? 'tablist' : undefined}
      style={{
        flexDirection: 'row',
        gap: spacing.xs,
        alignItems: 'center',
        ...(scroll
          ? {}
          : {
              backgroundColor: colors.surfaceRecessed,
              ...elevation.recessed,
              padding: spacing.xxs,
              borderRadius: layout.radius.sheet,
            }),
      }}
    >
      {selected && (
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[{
            position: 'absolute',
            top: scroll ? 0 : spacing.xxs,
            bottom: scroll ? 0 : spacing.xxs,
            left: 0,
            borderRadius: layout.radius.card,
            backgroundColor: colors.navigationSelection,
            ...elevation.subtle,
          }, indicatorStyle]}
        />
      )}
      {options.map((option) => {
        const active = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole={tabs ? 'tab' : 'button'}
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active }}
            aria-pressed={tabs ? undefined : active}
            onPress={() => onChange(option.value)}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              setPositions((previous) =>
                previous[option.value]?.x === x &&
                previous[option.value]?.width === width
                  ? previous
                  : { ...previous, [option.value]: { x, width } },
              );
            }}
            style={{
              minHeight: 38,
              paddingHorizontal: spacing.md,
              paddingVertical: 6,
              borderRadius: layout.radius.card,
              flexDirection: 'row',
              gap: spacing.xs,
              alignItems: 'center',
              justifyContent: 'center',
              ...(scroll ? {} : { flex: 1 }),
              backgroundColor: active
                ? selected
                  ? 'transparent'
                  : colors.navigationSelection
                : scroll
                  ? colors.surface
                  : 'transparent',
              ...(active
                ? selected
                  ? {}
                  : elevation.subtle
                : scroll
                  ? elevation.subtle
                  : {}),
            }}
          >
            {option.icon && (
              <Ionicons
                name={option.icon}
                size={layout.iconSize.md}
                color={active ? colors.navigationOnSelection : colors.ink}
              />
            )}
            <AppText variant="label" color={active ? colors.navigationOnSelection : 'ink'}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
  return scroll ? (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel={label}
      style={
        edgeToEdge ? { marginHorizontal: -spacing.contentPadding } : undefined
      }
      contentContainerStyle={
        edgeToEdge ? { paddingHorizontal: spacing.contentPadding } : undefined
      }
    >
      {row}
    </ScrollView>
  ) : (
    row
  );
}
