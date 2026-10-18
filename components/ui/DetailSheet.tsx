import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  AccessibilityInfo,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppScreen } from './AppScreen';
import { AppHeader } from './AppHeader';
import { AppText } from './AppText';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';

/** Attached, non-modal detail panel: dragging the handle leaves the photo visible.
 * A modal BottomSheet would dim/occlude that photo and interrupt this full-page task.
 */
export function DetailSheet({
  title,
  image,
  onBack,
  children,
  footer,
}: {
  title: string;
  image?: string;
  onBack: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [failedImage, setFailedImage] = useState<string>();
  const photo = Boolean(image && failedImage !== image);
  const resting = photo ? Math.min(320, Math.max(180, height * 0.32)) : 8;
  const minimum = photo ? insets.top : 0;
  const [expansion, setExpansion] = useState({ resting, expanded: false });
  const expanded = expansion.resting === resting && expansion.expanded;
  const [motion] = useState(
    () => new SheetMotion(resting, minimum, setExpansion),
  );
  useEffect(() => {
    motion.configure(resting, minimum);
  }, [resting, minimum, motion]);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((v) =>
      motion.setReduced(v),
    );
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) =>
      motion.setReduced(v),
    );
    return () => {
      sub.remove();
      motion.stop();
    };
  }, [motion]);
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(photo && !expanded ? 'light' : 'dark');
      return () => setStatusBarStyle('dark');
    }, [photo, expanded]),
  );
  return (
    <AppScreen
      keyboardAvoiding
      edges={photo ? ['left', 'right'] : ['top', 'left', 'right']}
    >
      {!photo && <AppHeader title={title} onBack={onBack} />}
      <View style={styles.stage}>
        {photo && (
          <View
            pointerEvents="box-none"
            style={[styles.backArea, { top: insets.top }]}
          >
            <AppHeader title="" onBack={onBack} overlay />
          </View>
        )}
        {photo && (
          <Image
            source={{ uri: image }}
            contentFit="cover"
            style={[styles.hero, { height: resting + layout.radius.sheet }]}
            onError={() => setFailedImage(image)}
            accessibilityLabel={`Foto de ${title}`}
          />
        )}
        <Animated.View style={[styles.sheet, { top: motion.top }]}>
          {photo ? (
            <View {...motion.responder.panHandlers}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  expanded ? 'Recolher detalhes' : 'Expandir detalhes'
                }
                accessibilityState={{ expanded }}
                aria-expanded={expanded}
                onPress={() => motion.settle(expanded ? resting : minimum)}
                style={styles.handleTarget}
              >
                <View style={styles.handle} />
              </Pressable>
            </View>
          ) : (
            <View style={{ height: spacing.lg }} />
          )}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.content,
              {
                paddingBottom: footer
                  ? spacing.xl
                  : Math.max(insets.bottom, spacing.xl),
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer && (
            <View
              style={[
                styles.footer,
                { paddingBottom: Math.max(insets.bottom, spacing.sm) },
              ]}
            >
              {footer}
            </View>
          )}
        </Animated.View>
      </View>
    </AppScreen>
  );
}

export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <View style={styles.section}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        style={styles.sectionHeader}
      >
        <AppText variant="sectionTitle" style={{ flex: 1 }}>
          {title}
        </AppText>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.ink}
        />
      </Pressable>
      {open && <View style={{ gap: spacing.sm }}>{children}</View>}
    </View>
  );
}

// Gesture bookkeeping is an imperative animation controller, not React render state.
class SheetMotion {
  readonly top: Animated.Value;
  private resting: number;
  private minimum: number;
  private current: number;
  private start = 0;
  private reduced = false;
  readonly responder: ReturnType<typeof PanResponder.create>;
  constructor(
    resting: number,
    minimum: number,
    private onExpanded: (state: { resting: number; expanded: boolean }) => void,
  ) {
    this.resting = resting;
    this.minimum = minimum;
    this.current = resting;
    this.top = new Animated.Value(resting);
    this.responder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        this.resting > 8 &&
        Math.abs(g.dy) > 6 &&
        Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        this.top.stopAnimation((value) => {
          this.start = value;
        });
      },
      onPanResponderMove: (_, g) =>
        this.top.setValue(
          Math.max(this.minimum, Math.min(this.resting, this.start + g.dy)),
        ),
      onPanResponderRelease: (_, g) =>
        this.settle(
          this.start + g.dy < (this.resting + this.minimum) / 2
            ? this.minimum
            : this.resting,
        ),
      onPanResponderTerminate: () => this.settle(this.current),
    });
  }
  configure(resting: number, minimum: number) {
    this.resting = resting;
    this.current = resting;
    this.top.setValue(resting);
  }
  setReduced(value: boolean) {
    this.reduced = value;
  }
  stop() {
    this.top.stopAnimation();
  }
  settle(value: number) {
    this.current = value;
    this.onExpanded({
      resting: this.resting,
      expanded: value < (this.resting + this.minimum) / 2,
    });
    Animated.timing(this.top, {
      toValue: value,
      duration: this.reduced ? 0 : 220,
      useNativeDriver: false,
    }).start();
  }
}

const styles = StyleSheet.create({
  stage: { flex: 1, overflow: 'hidden' },
  hero: { width: '100%' },
  backArea: { position: 'absolute', left: 0, right: 0, height: 72, zIndex: 3 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.canvas,
    borderTopLeftRadius: layout.radius.sheet,
    borderTopRightRadius: layout.radius.sheet,
    overflow: 'hidden',
  },
  handleTarget: { height: 48, alignItems: 'center', justifyContent: 'center' },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.divider,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: spacing.contentPadding,
    gap: spacing.lg,
    flexGrow: 1,
  },
  footer: {
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.contentPadding,
    paddingTop: spacing.sm,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: layout.radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
