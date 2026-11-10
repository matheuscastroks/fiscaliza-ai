import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  BackHandler,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSegments } from 'expo-router';
import ReanimatedDrawerLayout, {
  DrawerKeyboardDismissMode,
  DrawerLockMode,
  DrawerPosition,
  DrawerType,
  DrawerState,
  type DrawerLayoutMethods,
} from 'react-native-gesture-handler/ReanimatedDrawerLayout';
import { SideMenu, useMenu } from './SideMenu';

const MAIN_TABS = new Set([
  'index',
  'TerritoryScreen',
  'ParticipateScreen',
  'FollowScreen',
  'ProfileScreen',
]);
const DRAWER_EDGE_WIDTH = 48;
const DRAWER_MIN_SWIPE_DISTANCE = 8;

/** Edge-only gestures on main tabs leave nested screens' back gestures intact. */
export function AppDrawer({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const drawer = useRef<DrawerLayoutMethods>(null);
  const menuView = useRef<React.ComponentRef<typeof View>>(null);
  const actualOpen = useRef(false);
  const afterClose = useRef<(() => void) | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const open = useMenu((state) => state.open);
  const segments: readonly string[] = useSegments();
  const { width } = useWindowDimensions();
  const enabled = Boolean(
    segments[0] === '(tabs)' && MAIN_TABS.has(segments[1] || 'index'),
  );
  const isMapTab = Boolean(
    segments[0] === '(tabs)' &&
      (!segments[1] ||
        segments[1] === 'index' ||
        segments[1] === 'TerritoryScreen'),
  );
  const canSwipeOpen = enabled && (!isMapTab || open);

  const close = useCallback((action?: () => void) => {
    afterClose.current = action;
    drawer.current?.closeDrawer();
  }, []);

  useEffect(() => {
    if (!enabled) {
      afterClose.current = undefined;
      drawer.current?.closeDrawer();
      useMenu.getState().setOpen(false);
    } else if (open && !actualOpen.current) {
      drawer.current?.openDrawer();
    } else if (!open && actualOpen.current) {
      drawer.current?.closeDrawer();
    }
  }, [open, enabled]);

  useEffect(() => {
    if (!open) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => back.remove();
  }, [open, close]);

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.canvas }}
    >
      <ReanimatedDrawerLayout
        ref={drawer}
        drawerPosition={DrawerPosition.LEFT}
        drawerType={DrawerType.FRONT}
        drawerWidth={Math.min(Math.round(width * 0.9), 480)}
        drawerLockMode={
          canSwipeOpen ? DrawerLockMode.UNLOCKED : DrawerLockMode.LOCKED_CLOSED
        }
        edgeWidth={DRAWER_EDGE_WIDTH}
        minSwipeDistance={DRAWER_MIN_SWIPE_DISTANCE}
        keyboardDismissMode={DrawerKeyboardDismissMode.ON_DRAG}
        enableTrackpadTwoFingerGesture
        overlayColor={colors.scrim}
        drawerBackgroundColor={colors.transparent}
        onDrawerStateChanged={(state) => {
          if (state !== DrawerState.IDLE) setVisible(true);
        }}
        onDrawerOpen={() => {
          setVisible(true);
          actualOpen.current = true;
          useMenu.getState().setOpen(true);
        }}
        onDrawerClose={() => {
          setVisible(false);
          actualOpen.current = false;
          useMenu.getState().setOpen(false);
          const action = afterClose.current;
          afterClose.current = undefined;
          action?.();
        }}
        renderNavigationView={() => (
          <View ref={menuView} style={styles.fill}>
            <SideMenu onClose={close} visible={visible} />
          </View>
        )}
      >
        <View
          style={styles.fill}
          aria-hidden={open}
          accessibilityElementsHidden={open}
        >
          {children}
        </View>
      </ReanimatedDrawerLayout>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({ fill: { flex: 1 } });
