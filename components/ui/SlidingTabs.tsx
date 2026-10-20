import { useTheme } from '@/theme/useTheme';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { AppSelect } from './AppSelect';
import { spacing } from '@/theme';

export interface SlidingOption {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

/** One moving selection surface; automatically switches to a searchable select when > 5 options. */
export function SlidingTabs({
  options,
  value,
  onChange,
  label,
  scroll = true,
  edgeToEdge = true,
  tabs = false,
}: {
  options: readonly SlidingOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  scroll?: boolean;
  edgeToEdge?: boolean;
  tabs?: boolean;
}) {
  const { colors } = useTheme();

  const [positions, setPositions] = useState<
    Record<string, { x: number; width: number }>
  >({});
  const [reduced, setReduced] = useState(false);
  const [left] = useState(() => new Animated.Value(0));
  const [width] = useState(() => new Animated.Value(0));
  const positioned = useRef(false);
  const selected = positions[value];
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduced(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  useEffect(() => {
    if (!selected) return;
    if (!positioned.current || reduced) {
      left.setValue(selected.x);
      width.setValue(selected.width);
      positioned.current = true;
      return;
    }
    const motion = Animated.parallel([
      Animated.timing(left, {
        toValue: selected.x,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(width, {
        toValue: selected.width,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);
    motion.start();
    return () => motion.stop();
  }, [selected, reduced, left, width]);

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
              backgroundColor: colors.surface,
              padding: spacing.xxs,
              borderRadius: 32,
            }),
      }}
    >
      {selected && (
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            position: 'absolute',
            top: scroll ? 0 : spacing.xxs,
            bottom: scroll ? 0 : spacing.xxs,
            left,
            width,
            borderRadius: 28,
            backgroundColor: colors.darkPill,
          }}
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
              borderRadius: 24,
              flexDirection: 'row',
              gap: spacing.xs,
              alignItems: 'center',
              justifyContent: 'center',
              ...(scroll ? {} : { flex: 1 }),
              backgroundColor: active
                ? selected
                  ? 'transparent'
                  : colors.darkPill
                : colors.surface,
              borderWidth: 1,
              borderColor: active ? 'transparent' : colors.border,
              elevation: scroll && !active ? 1 : 0,
              shadowColor: scroll && !active ? '#000000' : undefined,
              shadowOffset:
                scroll && !active ? { width: 0, height: 1 } : undefined,
              shadowOpacity: scroll && !active ? 0.08 : undefined,
              shadowRadius: scroll && !active ? 3 : undefined,
            }}
          >
            {option.icon && (
              <Ionicons
                name={option.icon}
                size={20}
                color={active ? colors.onSelection : colors.ink}
              />
            )}
            <AppText variant="label" color={active ? 'onSelection' : 'ink'}>
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
