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
  AccessibilityInfo,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type Tabs } from 'expo-router';
import { AppText } from './AppText';
import { useTerritoryStore } from '@/stores/territoryStore';
import { beginMapTrace } from '@/features/territory/mapPerformance';
import { fontSizes } from '@/theme/typography';
import { elevation } from '@/theme/elevation';

const TAB_HEIGHT = 48;
const TAB_PADDING = 6;
const TAB_GAP = 6;

export type AppTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];

export type FloatingGlassTabBarProps = AppTabBarProps;

const VISIBLE = new Set([
  'TerritoryScreen',
  'FollowScreen',
  'ParticipateScreen',
  'ProfileScreen',
]);

/**
 * Barra de abas principal com cápsula sólida, ícone + rótulo visível e indicador com física de mola.
 */
export function AppTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
}: AppTabBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const visibleRoutes = state.routes.filter((route) => VISIBLE.has(route.name));
  const currentRouteName = state.routes[state.index]?.name || 'TerritoryScreen';
  const effectiveRouteName =
    currentRouteName === 'index' ? 'TerritoryScreen' : currentRouteName;

  const tabCount = Math.max(1, visibleRoutes.length);
  const maxBarWidth = Math.min(width - insets.left - insets.right - 24, 388);
  const tabWidth = Math.max(
    64,
    Math.floor(
      (maxBarWidth - 2 * TAB_PADDING - (tabCount - 1) * TAB_GAP) / tabCount,
    ),
  );
  const barWidth =
    tabCount * tabWidth + (tabCount - 1) * TAB_GAP + 2 * TAB_PADDING;

  const selectedIndex = Math.max(
    0,
    visibleRoutes.findIndex((route) => route.name === effectiveRouteName),
  );

  const target = selectedIndex * (tabWidth + TAB_GAP);
  const [selectionAnim] = useState(() => new Animated.Value(target));
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReducedMotion(value);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      selectionAnim.setValue(target);
      return;
    }
    const spring = Animated.spring(selectionAnim, {
      toValue: target,
      damping: 24,
      stiffness: 280,
      mass: 0.8,
      useNativeDriver: true,
    });
    spring.start();
    return () => spring.stop();
  }, [target, reducedMotion, selectionAnim]);

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const isListView = useTerritoryStore((s) => s.isListView);

  if (keyboardVisible || !VISIBLE.has(effectiveRouteName)) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.barContainer,
        {
          bottom: insets.bottom + 14,
          left: insets.left,
          right: insets.right,
        },
      ]}
    >
      <View
        style={[
          styles.bar,
          { width: barWidth, paddingHorizontal: TAB_PADDING },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.selected,
            {
              width: tabWidth,
              top: TAB_PADDING,
              left: TAB_PADDING,
              transform: [{ translateX: selectionAnim }],
            },
          ]}
        />
        {visibleRoutes.map((route) => {
          const focused = route.name === effectiveRouteName;
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title || route.name;
          const itemColor = focused
            ? colors.navigationOnSelection
            : colors.navigationIcon;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = emitter.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  if (route.name === 'TerritoryScreen' && !isListView)
                    beginMapTrace('tab');
                  navigateToTab(route.key);
                }
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              onLongPress={() =>
                emitter.emit({ type: 'tabLongPress', target: route.key })
              }
              style={({ pressed }) => [
                styles.tab,
                { width: tabWidth },
                pressed && {
                  opacity: 0.75,
                  transform: [{ scale: 0.94 }],
                },
              ]}
            >
              <View collapsable={false} style={styles.tabContent}>
                {options.tabBarIcon?.({
                  focused,
                  color: itemColor,
                  size: 20,
                })}
                <AppText
                  variant="meta"
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    {
                      color: itemColor,
                      fontWeight: focused ? '700' : '600',
                    },
                  ]}
                >
                  {label}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Alias para retrocompatibilidade
export const FloatingGlassTabBar = AppTabBar;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    barContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: TAB_HEIGHT + 2 * TAB_PADDING,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99,
    },
    bar: {
      height: TAB_HEIGHT + 2 * TAB_PADDING,
      borderRadius: (TAB_HEIGHT + 2 * TAB_PADDING) / 2,
      backgroundColor: colors.navigationSurface,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      ...elevation.floating,
    },
    tab: {
      height: TAB_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabContent: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    tabLabel: {
      fontSize: fontSizes.caption,
      lineHeight: 12,
    },
    selected: {
      position: 'absolute',
      height: TAB_HEIGHT,
      borderRadius: TAB_HEIGHT / 2,
      backgroundColor: colors.navigationSelection,
    },
  });
