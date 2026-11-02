import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import React, { useRef, useState, useCallback, memo, type ReactNode } from 'react';
import {
  Animated,
  ScrollView,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { layout, spacing } from '@/theme';

export interface CityCarouselProps<T extends { id: string }> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  label: string;
  edgeToEdge?: boolean;
}

/** Native horizontal scrolling with the next cards set back, like the approved reference. */
function CityCarouselComponent<T extends { id: string }>({
  items,
  renderItem,
  label,
  edgeToEdge = true,
}: CityCarouselProps<T>) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const { width } = useWindowDimensions();
  const initialViewport = Math.min(width, 760) - spacing.contentPadding * 2;
  const [viewport, setViewport] = useState(initialViewport);
  const [index, setIndex] = useState(0);
  const [scrollX] = useState(() => new Animated.Value(0));
  const list = useRef<ScrollView>(null);

  const displayItems = items.length > 8 ? items.slice(0, 8) : items;
  const available = viewport - (edgeToEdge ? spacing.contentPadding * 2 : 0);
  const cardWidth = Math.max(
    120,
    displayItems.length > 1 ? available - 24 : available,
  );
  const step = Math.max(1, cardWidth + spacing.sm);
  const current = Math.min(index, displayItems.length - 1);

  const go = useCallback(
    (next: number) => {
      setIndex(next);
      list.current?.scrollTo({ x: next * step, animated: true });
    },
    [step],
  );

  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number } } }) => {
      const w = Math.round(event.nativeEvent.layout.width);
      if (w > 0 && Math.abs(w - viewport) > 4) {
        setViewport(w);
      }
    },
    [viewport],
  );

  return (
    <View
      style={[
        styles.container,
        edgeToEdge && { marginHorizontal: -spacing.contentPadding },
      ]}
      onLayout={handleLayout}
    >
      <Animated.ScrollView
        ref={list}
        horizontal
        accessibilityLabel={label}
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={{
          paddingLeft: edgeToEdge ? spacing.contentPadding : 0,
          paddingBottom: spacing.lg,
          paddingRight:
            (displayItems.length > 1 ? 24 : 0) +
            (edgeToEdge ? spacing.contentPadding : 0),
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) =>
          setIndex(
            Math.max(
              0,
              Math.min(
                displayItems.length - 1,
                Math.round(event.nativeEvent.contentOffset.x / step),
              ),
            ),
          )
        }
      >
        {displayItems.map((item, itemIndex) => {
          const inputRange = [
            (itemIndex - 1) * step,
            itemIndex * step,
            (itemIndex + 1) * step,
          ];
          return (
            <Animated.View
              key={item.id}
              style={{
                width: cardWidth,
                marginRight: spacing.sm,
                transform: [
                  {
                    scale: scrollX.interpolate({
                      inputRange,
                      outputRange: [0.93, 1, 0.93],
                      extrapolate: 'clamp',
                    }),
                  },
                  {
                    translateY: scrollX.interpolate({
                      inputRange,
                      outputRange: [12, 0, 12],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              }}
            >
              {renderItem(item)}
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
      {items.length > 1 && (
        <View
          style={[
            styles.controls,
            edgeToEdge && { paddingHorizontal: spacing.contentPadding },
          ]}
        >
          <AppText
            variant="meta"
            color="muted"
            accessibilityLiveRegion="polite"
          >
            {current + 1} de {items.length}
          </AppText>
          <View style={styles.arrows}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cartão anterior"
              disabled={current <= 0}
              onPress={() => go(current - 1)}
              style={[styles.arrow, current <= 0 && styles.disabled]}
            >
              <Ionicons name="arrow-back" size={20} color={colors.ink} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Próximo cartão"
              disabled={current >= displayItems.length - 1}
              onPress={() => go(current + 1)}
              style={[
                styles.arrow,
                current >= displayItems.length - 1 && styles.disabled,
              ]}
            >
              <Ionicons name="arrow-forward" size={20} color={colors.ink} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

export const CityCarousel = memo(CityCarouselComponent) as typeof CityCarouselComponent;
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { gap: spacing.xxs },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    arrows: { flexDirection: 'row', gap: spacing.xs },
    arrow: {
      width: layout.touchTarget.minWidth,
      height: layout.touchTarget.minHeight,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabled: { opacity: 0.3 },
  });
