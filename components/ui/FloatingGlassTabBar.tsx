import React, { useEffect, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tabs } from 'expo-router';
import { colors } from '@/theme/colors';

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
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
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
  const barWidth = Math.min(4 * 52 + 3 * 4 + 2 * 4, width - 32);
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
                <View
                  pointerEvents="none"
                  collapsable={false}
                  style={[styles.selected, { opacity: focused ? 1 : 0 }]}
                />
                {options.tabBarIcon?.({
                  focused,
                  color: focused ? colors.ink : colors.white,
                  size: 24,
                })}
              </View>
            </Pressable>
          );
        })}
    </View>
  );
}
const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.ink,
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
    backgroundColor: colors.white,
  },
});
