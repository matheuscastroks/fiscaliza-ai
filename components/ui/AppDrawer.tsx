import { DesktopNavigation } from './DesktopNavigation';
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
  Platform,
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
import { useAuthStore } from '@/stores/authStore';

const MAIN_TABS = new Set([
  'index',
  'TerritoryScreen',
  'ParticipateScreen',
  'FollowScreen',
]);
const DRAWER_EDGE_WIDTH = 48;
const DRAWER_MIN_SWIPE_DISTANCE = 8;

/** Edge-only gestures on main tabs leave nested screens' back gestures intact. */
export function AppDrawer({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const drawer = useRef<DrawerLayoutMethods>(null);
  const menuView = useRef<View>(null);
  const actualOpen = useRef(false);
  const afterClose = useRef<(() => void) | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const open = useMenu((state) => state.open);
  const user = useAuthStore((state) => state.user);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const segments: readonly string[] = useSegments();
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 1100;
  const showNavigation =
    desktop &&
    authenticated &&
    Boolean(user?.municipality) &&
    segments[0] !== 'OnboardingScreen';
  const enabled = Boolean(
    !desktop &&
      authenticated &&
      user?.municipality &&
      segments[0] === '(tabs)' &&
      MAIN_TABS.has(segments[1] || 'index'),
  );

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

  useEffect(() => {
    if (Platform.OS !== 'web' || !open) return;
    const previous = document.activeElement as HTMLElement | null;
    const container = menuView.current as unknown as HTMLElement | null;
    const focusable = () =>
      Array.from(
        container?.querySelectorAll<HTMLElement>(
          'button, [role="button"], [tabindex="0"]',
        ) || [],
      ).filter((element) => element.getClientRects().length > 0);
    const frame = requestAnimationFrame(() => focusable()[0]?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const next = event.shiftKey ? elements.at(-1) : elements[0];
      const boundary = event.shiftKey ? elements[0] : elements.at(-1);
      if (
        document.activeElement === boundary ||
        !container?.contains(document.activeElement)
      ) {
        event.preventDefault();
        next?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey);
      if (previous?.isConnected) previous.focus();
    };
  }, [open, close]);

  return (
    <View
      style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.canvas }}
    >
      {showNavigation && <DesktopNavigation />}
      <View style={{ flex: 1, minWidth: 0 }}>
        <ReanimatedDrawerLayout
          ref={drawer}
          drawerPosition={DrawerPosition.LEFT}
          drawerType={DrawerType.FRONT}
          drawerWidth={Math.min(Math.round(width * 0.9), 480)}
          drawerLockMode={
            enabled ? DrawerLockMode.UNLOCKED : DrawerLockMode.LOCKED_CLOSED
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
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({ fill: { flex: 1 } });
