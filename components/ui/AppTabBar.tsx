import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Keyboard,
  Animated,
  AccessibilityInfo,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTerritoryViewMode } from '@/stores/territoryStore';
import { beginMapTrace } from '@/features/territory/mapPerformance';

const TAB_SIZE = 48;
const TAB_PADDING = 8;
const TAB_GAP = 8;

export type AppTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];

export type FloatingGlassTabBarProps = AppTabBarProps;

const VISIBLE = new Set([
  'index',
  'TerritoryScreen',
  'FollowScreen',
  'ParticipateScreen',
  'ProfileScreen',
]);

/**
 * Barra de abas principal com cápsula sólida, navegação tátil e indicador com física de mola.
 */
export function AppTabBar({ state, descriptors, navigation }: AppTabBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const visibleRoutes = state.routes.filter((route) => VISIBLE.has(route.name));
  const isTerritory = state.routes[state.index]?.name === 'TerritoryScreen';
  const tabCount = Math.max(1, visibleRoutes.length);
  const extraSpace = TAB_SIZE + TAB_GAP;
  // Reserve room for the contextual button on every route so navigation never
  // changes the capsule's dimensions or its touch targets.
  const availableWidth = width - insets.left - insets.right - 16 - extraSpace;
  const horizontalPadding = Math.min(TAB_PADDING, Math.max(0, (availableWidth - tabCount * TAB_SIZE) / 2));
  const barWidth = Math.min(
    tabCount * TAB_SIZE +
      (tabCount - 1) * TAB_GAP +
      2 * horizontalPadding,
    availableWidth,
  );

  const selectedIndex = Math.max(
    0,
    visibleRoutes.findIndex(
      (route) => route.key === state.routes[state.index]?.key,
    ),
  );

  const target =
    tabCount > 1
      ? (selectedIndex * (barWidth - 2 * horizontalPadding - TAB_SIZE)) /
        (tabCount - 1)
      : 0;
  const selectionAnim = useRef(new Animated.Value(target)).current;
  const [reducedMotion, setReducedMotion] = useState(false);
  const territoryAnim = useRef(new Animated.Value(isTerritory ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      territoryAnim.setValue(isTerritory ? 1 : 0);
      return;
    }
    const transition = Animated.timing(territoryAnim, {
      toValue: isTerritory ? 1 : 0,
      duration: 480,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    transition.start();
    return () => transition.stop();
  }, [isTerritory, reducedMotion, territoryAnim]);

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

  const { isListView, toggleViewMode } = useTerritoryViewMode();

  if (keyboardVisible || !VISIBLE.has(state.routes[state.index]?.name)) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.barContainer,
        {
          bottom: insets.bottom + 16,
          left: insets.left,
          right: insets.right,
        },
      ]}
    >
      {/* The neck stretches out of the capsule, then pinches closed as the
          contextual button separates. It never receives touches. */}
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          left: '50%',
          marginLeft: barWidth / 2 - 44,
          width: 40,
          height: 24,
          borderRadius: 12,
          backgroundColor: colors.navigationSurface,
          transform: [
            { scaleX: territoryAnim.interpolate({ inputRange: [0, 0.18, 0.45, 0.65, 0.82, 1], outputRange: [0, 0.4, 1, 0.7, 0, 0] }) },
            { scaleY: territoryAnim.interpolate({ inputRange: [0, 0.18, 0.45, 0.65, 0.82, 1], outputRange: [0, 1, 0.65, 0.25, 0, 0] }) },
          ],
        }}
      />
      <Animated.View
        style={[
          styles.bar,
          { width: barWidth, paddingHorizontal: horizontalPadding, zIndex: 2 },
          { transform: [{ translateX: territoryAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -extraSpace / 2] }) }] },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.selected,
            {
              top: TAB_PADDING,
              left: horizontalPadding,
              transform: [{ translateX: selectionAnim }],
            },
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
                  if (!focused && !event.defaultPrevented) {
                    if (route.name === 'TerritoryScreen' && !isListView) beginMapTrace('tab');
                    navigation.navigate(route.name);
                  }
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                onLongPress={() =>
                  navigation.emit({ type: 'tabLongPress', target: route.key })
                }
                style={({ pressed }) => [
                  styles.tab,
                  pressed && {
                    opacity: 0.75,
                    transform: [{ scale: 0.92 }],
                  },
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
      </Animated.View>

      <Animated.View
        pointerEvents={isTerritory ? 'auto' : 'none'}
        accessibilityElementsHidden={!isTerritory}
        importantForAccessibility={isTerritory ? 'auto' : 'no-hide-descendants'}
        style={{
          position: 'absolute',
          left: '50%',
          marginLeft: barWidth / 2 + TAB_GAP - extraSpace / 2,
          zIndex: 1,
          transform: [
            { translateX: territoryAnim.interpolate({ inputRange: [0, 0.25, 0.6, 0.85, 1], outputRange: [-64, -42, -12, 3, 0] }) },
            { scaleX: territoryAnim.interpolate({ inputRange: [0, 0.4, 0.75, 1], outputRange: [1, 1.14, 0.94, 1] }) },
            { scaleY: territoryAnim.interpolate({ inputRange: [0, 0.4, 0.75, 1], outputRange: [1, 0.84, 1.06, 1] }) },
          ],
        }}
      >
        <Pressable
          disabled={!isTerritory}
          accessibilityRole="button"
          accessibilityLabel={
            isListView
              ? 'Alternar para visualização no Mapa'
              : 'Alternar para visualização em Lista'
          }
          onPress={() => {
            if (isListView) beginMapTrace('list-to-map');
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleViewMode();
          }}
          style={({ pressed }) => [
            styles.extraButton,
            pressed && { opacity: 0.75, transform: [{ scale: 0.92 }] },
          ]}
        >
          <Ionicons
            name={isListView ? 'map' : 'list'}
            size={22}
            color={colors.navigationIcon}
          />
        </Pressable>
      </Animated.View>
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
      height: TAB_SIZE + 2 * TAB_PADDING,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      zIndex: 99,
    },
    bar: {
      height: TAB_SIZE + 2 * TAB_PADDING,
      borderRadius: (TAB_SIZE + 2 * TAB_PADDING) / 2,
      backgroundColor: colors.navigationSurface,
      flexDirection: 'row',
      paddingHorizontal: TAB_PADDING,
      justifyContent: 'space-between',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.14,
          shadowRadius: 14,
        },
        android: { elevation: 6 },
      }),
    },
    extraButton: {
      width: TAB_SIZE,
      height: TAB_SIZE,
      borderRadius: TAB_SIZE / 2,
      backgroundColor: colors.navigationSurface,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.14,
          shadowRadius: 14,
        },
        android: { elevation: 6 },
      }),
    },
    tab: {
      width: TAB_SIZE,
      minHeight: TAB_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      width: TAB_SIZE,
      height: TAB_SIZE,
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
      width: TAB_SIZE,
      height: TAB_SIZE,
      borderRadius: 9999,
      backgroundColor: colors.navigationSelection,
    },
  });
