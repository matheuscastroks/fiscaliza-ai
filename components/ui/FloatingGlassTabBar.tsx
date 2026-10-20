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
import { router, type Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTerritoryViewMode } from '@/stores/territoryStore';
import { useFollowStore } from '@/stores/followStore';

const TAB_SIZE = 48;
const TAB_PADDING = 8;
const TAB_GAP = 8;

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
  const barWidth = Math.min(
    4 * TAB_SIZE + 3 * TAB_GAP + 2 * TAB_PADDING,
    width - 32,
  );
  const visibleRoutes = state.routes.filter((route) => VISIBLE.has(route.name));
  const selectedIndex = Math.max(
    0,
    visibleRoutes.findIndex(
      (route) => route.key === state.routes[state.index]?.key,
    ),
  );
  const target =
    (selectedIndex * (barWidth - 2 * TAB_PADDING - TAB_SIZE)) / 3;
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
  const activeRoute = state.routes[state.index]?.name;
  const isTerritory = activeRoute === 'TerritoryScreen';
  const isIndex = activeRoute === 'index';
  const isParticipate = activeRoute === 'ParticipateScreen';
  const isFollow = activeRoute === 'FollowScreen';

  const { isListView, toggleViewMode } = useTerritoryViewMode();
  const { statusFilter, toggleStatusFilter } = useFollowStore();

  if (
    (Platform.OS === 'web' && width >= 1100) ||
    keyboard ||
    !VISIBLE.has(state.routes[state.index]?.name)
  )
    return null;
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.barContainer,
        {
          bottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <View style={[styles.bar, { width: barWidth }]}>
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.selected,
            {
              top: TAB_PADDING,
              left: TAB_PADDING,
              transform: [{ translateX: selection }],
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

      {isTerritory && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isListView
              ? 'Alternar para visualização no Mapa'
              : 'Alternar para visualização em Lista'
          }
          onPress={() => {
            if (Platform.OS !== 'web')
              void Haptics.selectionAsync().catch(() => {});
            toggleViewMode();
          }}
          style={({ pressed }) => [
            styles.extraButton,
            pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] },
          ]}
        >
          <Ionicons
            name={isListView ? 'map' : 'list'}
            size={22}
            color={colors.navigationIcon}
          />
        </Pressable>
      )}

      {isIndex && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver resultados e prazos da Central 1746"
          onPress={() => {
            if (Platform.OS !== 'web')
              void Haptics.selectionAsync().catch(() => {});
            router.push('/ResultsScreen');
          }}
          style={({ pressed }) => [
            styles.extraButton,
            pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] },
          ]}
        >
          <Ionicons
            name="stats-chart"
            size={22}
            color={colors.navigationIcon}
          />
        </Pressable>
      )}

      {isParticipate && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Criar nova proposta popular"
          onPress={() => {
            if (Platform.OS !== 'web')
              void Haptics.selectionAsync().catch(() => {});
            router.push('/ProposalScreen');
          }}
          style={({ pressed }) => [
            styles.extraButton,
            pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] },
          ]}
        >
          <Ionicons
            name="bulb-outline"
            size={22}
            color={colors.navigationIcon}
          />
        </Pressable>
      )}

      {isFollow && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            statusFilter === 'open'
              ? 'Mostrando demandas em andamento. Tocar para ver resolvidas'
              : 'Mostrando demandas resolvidas. Tocar para ver em andamento'
          }
          onPress={() => {
            if (Platform.OS !== 'web')
              void Haptics.selectionAsync().catch(() => {});
            toggleStatusFilter();
          }}
          style={({ pressed }) => [
            styles.extraButton,
            pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] },
          ]}
        >
          <Ionicons
            name={statusFilter === 'open' ? 'time-outline' : 'checkmark-circle-outline'}
            size={22}
            color={statusFilter === 'open' ? colors.attention : colors.completed}
          />
        </Pressable>
      )}
    </View>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    barContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
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
          shadowOpacity: 0.12,
          shadowRadius: 12,
        },
        android: { elevation: 4 },
        web: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
      }),
    },
    extraButton: {
      width: TAB_SIZE + 2 * TAB_PADDING,
      height: TAB_SIZE + 2 * TAB_PADDING,
      borderRadius: (TAB_SIZE + 2 * TAB_PADDING) / 2,
      backgroundColor: colors.navigationSurface,
      alignItems: 'center',
      justifyContent: 'center',
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
