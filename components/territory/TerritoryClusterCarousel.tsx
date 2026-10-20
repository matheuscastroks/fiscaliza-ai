import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import {
  TerritoryCardContent,
  type Entry,
} from '@/components/territory/TerritoryPreviewCard';

interface TerritoryClusterCarouselProps {
  entries: Entry[];
  onOpen: (entry: Entry) => void;
  onClose: () => void;
  onZoomCluster?: () => void;
  bottomOffset?: number;
}

export function TerritoryClusterCarousel({
  entries,
  onOpen,
  onClose,
  onZoomCluster,
  bottomOffset = 90,
}: TerritoryClusterCarouselProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);

  const cardWidth = Math.min(width - spacing.md * 2, 330);
  const snapInterval = cardWidth + spacing.sm;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / snapInterval);
      if (index >= 0 && index < entries.length) {
        setCurrentIndex(index);
      }
    },
    [snapInterval, entries.length],
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      {/* Header controls: Counter + Zoom In + Close */}
      <View style={styles.headerRow}>
        <View style={[styles.counterBadge, { backgroundColor: colors.surface }]}>
          <Ionicons name="layers" size={14} color={colors.accent} />
          <AppText variant="caption" style={{ fontWeight: '700' }}>
            {currentIndex + 1} de {entries.length} no local
          </AppText>
        </View>

        <View style={styles.actionsGroup}>
          {onZoomCluster && (
            <Pressable
              style={[styles.actionPill, { backgroundColor: colors.surface }]}
              onPress={onZoomCluster}
              accessibilityRole="button"
              accessibilityLabel="Aproximar mapa neste local"
            >
              <Ionicons name="scan-outline" size={14} color={colors.ink} />
              <AppText variant="caption" style={{ fontWeight: '700' }}>
                Aproximar
              </AppText>
            </Pressable>
          )}

          <Pressable
            style={[styles.closeCircle, { backgroundColor: colors.surface }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar visualização de aglomerado"
            hitSlop={8}
          >
            <Ionicons name="close" size={16} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      {/* Horizontal Carousel List */}
      <FlatList
        horizontal
        data={entries}
        keyExtractor={(item) => item.type + ':' + item.item.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.cardItem, { width: cardWidth }]}>
            <TerritoryCardContent
              entry={item}
              onOpen={onOpen}
              hideClose={true}
            />
          </View>
        )}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 100,
      gap: spacing.xs,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
    },
    counterBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: layout.radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 4,
    },
    actionsGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    actionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: layout.radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 4,
    },
    closeCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 4,
    },
    listContent: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      paddingBottom: 2,
    },
    cardItem: {
      backgroundColor: colors.surface,
      borderRadius: layout.radius.card,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 14,
      elevation: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
    },
  });
