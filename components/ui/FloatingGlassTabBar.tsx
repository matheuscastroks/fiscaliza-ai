import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import React, { useEffect, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Keyboard,
  Animated,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tabs } from 'expo-router';

export type FloatingGlassTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];
const VISIBLE = new Set([
  'index',
  'TerritoryScreen',
  'ParticipateScreen',
  'FollowScreen',
]);

/** Historical export name retained; the approved navigation is a solid onyx capsule. */
export function FloatingGlassTabBar({
  state,
  descriptors,
  navigation,
}: FloatingGlassTabBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const barWidth = Math.min(4 * 52 + 3 * 4 + 2 * 4, width - 32);
  const visibleRoutes = state.routes.filter((route) => VISIBLE.has(route.name));
  const selectedIndex = Math.max(
    0,
    visibleRoutes.findIndex(
      (route) => route.key === state.routes[state.index]?.key,
    ),
  );
  const target = (selectedIndex * (barWidth - 8 - 52)) / 3;
  const [selection] = useState(() => new Animated.Value(target));
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
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
    if (reduced) {
      selection.setValue(target);
      return;
    }
    const motion = Animated.timing(selection, {
      toValue: target,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    motion.start();
    return () => motion.stop();
  }, [target, reduced, selection]);
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboard(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboard(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  if (keyboard || !VISIBLE.has(state.routes[state.index]?.name)) return null;
  return (
    <View
      style={[
        styles.bar,
        {
          width: barWidth,
          left: (width - barWidth) / 2,
          bottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.selected,
          { top: 4, left: 4, transform: [{ translateX: selection }] },
        ]}
      />
      {state.routes
        .filter((route) => VISIBLE.has(route.name))
        .map((route) => {
          const focused = state.routes[state.index]?.key === route.key;
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title || route.name;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented)
                  navigation.navigate(route.name);
                if (Platform.OS !== 'web')
                  void Haptics.selectionAsync().catch(() => {});
              }}
              onLongPress={() =>
                navigation.emit({ type: 'tabLongPress', target: route.key })
              }
              style={({ pressed }) => [
                styles.tab,
                pressed && { opacity: 0.65 },
              ]}
            >
              <View collapsable={false} style={styles.icon}>
                {options.tabBarIcon?.({
                  focused,
                  color: focused
                    ? colors.navigationOnSelection
                    : colors.navigationIcon,
                  size: 24,
                })}
              </View>
            </Pressable>
          );
        })}
    </View>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    bar: {
      position: 'absolute',
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.navigationSurface,
      flexDirection: 'row',
      paddingHorizontal: 4,
      justifyContent: 'space-between',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
        },
        android: { elevation: 4 },
        web: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
      }),
    },
    tab: {
      width: 52,
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      width: 52,
      height: 52,
      borderRadius: 9999,
      overflow: 'hidden',
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selected: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 52,
      height: 52,
      borderRadius: 9999,
      backgroundColor: colors.navigationSelection,
    },
  });
