import { useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  ScrollView,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { colors, layout, spacing } from '@/theme';

/** Native horizontal scrolling with the next cards set back, like the approved reference. */
export function CityCarousel<T extends { id: string }>({
  items,
  renderItem,
  label,
  edgeToEdge = true,
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
  label: string;
  edgeToEdge?: boolean;
}) {
  const { width } = useWindowDimensions();
  const [viewport, setViewport] = useState(
    Math.min(width, 760) - spacing.contentPadding * 2,
  );
  const [index, setIndex] = useState(0);
  const [scrollX] = useState(() => new Animated.Value(0));
  const list = useRef<ScrollView>(null);
  const available = viewport - (edgeToEdge ? spacing.contentPadding * 2 : 0);
  const cardWidth = items.length > 1 ? available - 24 : available;
  const step = cardWidth + spacing.sm;
  const current = Math.min(index, items.length - 1);
  const go = (next: number) => {
    setIndex(next);
    list.current?.scrollTo({ x: next * step, animated: true });
  };
  return (
    <View
      style={[
        styles.container,
        edgeToEdge && { marginHorizontal: -spacing.contentPadding },
      ]}
      onLayout={(event) => setViewport(event.nativeEvent.layout.width)}
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
            (items.length > 1 ? 24 : 0) +
            (edgeToEdge ? spacing.contentPadding : 0),
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: Platform.OS !== 'web' },
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) =>
          setIndex(
            Math.max(
              0,
              Math.min(
                items.length - 1,
                Math.round(event.nativeEvent.contentOffset.x / step),
              ),
            ),
          )
        }
      >
        {items.map((item, itemIndex) => {
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
              disabled={current >= items.length - 1}
              onPress={() => go(current + 1)}
              style={[
                styles.arrow,
                current >= items.length - 1 && styles.disabled,
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
const styles = StyleSheet.create({
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
