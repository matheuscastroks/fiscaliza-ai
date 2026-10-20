import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { AppText } from './AppText';
import { OsmMapView, type MarkerKind } from './OsmMapView';

export interface ItemLocationMapProps {
  id?: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  neighborhood?: string;
  title?: string;
  kind?: MarkerKind;
  status?: string;
  color?: string;
  height?: number;
  showExpandAction?: boolean;
}

export function ItemLocationMap({
  id,
  latitude,
  longitude,
  address,
  neighborhood,
  title,
  kind = 'occurrence',
  status,
  color,
  height = 190,
  showExpandAction = true,
}: ItemLocationMapProps) {
  const { colors, mode } = useTheme();
  const styles = useThemedStyles(createStyles);

  const handleOpenMap = () => {
    router.push({
      pathname: '/(tabs)/TerritoryScreen',
      params: {
        focusId: id,
        lat: latitude != null ? String(latitude) : undefined,
        lng: longitude != null ? String(longitude) : undefined,
        neighborhood: neighborhood || undefined,
      },
    });
  };

  const isValid = useMemo(() => {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      Math.abs(latitude) <= 90 &&
      Math.abs(longitude) <= 180 &&
      (latitude !== 0 || longitude !== 0)
    );
  }, [latitude, longitude]);

  const pinColor = useMemo(() => {
    if (color) return color;
    if (kind === 'occurrence') {
      if (status === 'resolved') return colors.completed;
      if (status === 'in_progress') return '#2563eb';
      return colors.attention;
    }
    if (kind === 'proposal') return colors.attention;
    if (kind === 'action') return colors.completed;
    if (kind === 'consultation') return colors.muted;
    return colors.accent;
  }, [color, kind, status, colors]);

  if (!isValid || latitude == null || longitude == null) {
    return null;
  }

  const formattedAddress = address || neighborhood || 'Localização no município';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="location" size={16} color={pinColor} />
          <AppText variant="label" style={styles.headerLabel}>
            Localização exata
          </AppText>
        </View>
        {showExpandAction && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver no mapa territorial completo"
            onPress={handleOpenMap}
            style={({ pressed }) => [
              styles.expandButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <AppText variant="caption" color="accent" style={{ fontWeight: '600' }}>
              Abrir no mapa
            </AppText>
            <Ionicons name="chevron-forward" size={14} color={colors.accent} />
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={handleOpenMap}
        accessibilityRole="button"
        accessibilityLabel="Explorar no mapa completo"
        style={[styles.mapFrame, { height }]}
        collapsable={false}
      >
        <OsmMapView
          style={styles.map}
          region={{
            latitude,
            longitude,
            zoom: 16,
          }}
          markers={[
            {
              id: id || 'item-pin',
              latitude,
              longitude,
              title: title || formattedAddress,
              color: pinColor,
              kind,
            },
          ]}
          isDark={mode === 'dark'}
          interactive={false}
          onMarkerClick={handleOpenMap}
          onMapClick={handleOpenMap}
        />
      </Pressable>

      <View style={styles.footer}>
        <Ionicons name="navigate-outline" size={14} color={colors.muted} />
        <AppText variant="caption" color="muted" style={styles.addressText} numberOfLines={2}>
          {formattedAddress}
          {neighborhood && !formattedAddress.includes(neighborhood)
            ? ` · ${neighborhood}`
            : ''}
        </AppText>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: spacing.xs,
      marginVertical: spacing.xs,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xs,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    headerLabel: {
      fontWeight: '600',
    },
    expandButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: 2,
    },
    mapFrame: {
      width: '100%',
      borderRadius: layout.radius.card,
      overflow: 'hidden',
      backgroundColor: colors.surfaceSubdued,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    map: {
      width: '100%',
      height: '100%',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.xs,
      paddingTop: 2,
    },
    addressText: {
      flex: 1,
      lineHeight: 16,
    },
  });
