import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/useTheme';
import type { PublicFacilitySummary } from '@/shared/public-data';
import {
  facilityLabels,
  facilityIcons,
  facilityNeighborhoodLabel,
} from '@/features/territory/selectors';
export const facilityTitle = (item: PublicFacilitySummary) =>
  item.name || item.address || 'Espaço público sem nome informado';
export function FacilityRow({
  item,
  onPress,
}: {
  item: PublicFacilitySummary;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${facilityTitle(item)}`}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 22,
        backgroundColor: colors.surface,
        minHeight: 92,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.surfaceSubdued,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name={facilityIcons[item.category]}
          size={21}
          color={colors.ink}
        />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <AppText variant="caption" color="muted">
          {facilityLabels[item.category]}
        </AppText>
        <AppText variant="label">{facilityTitle(item)}</AppText>
        <AppText variant="caption" color="muted">
          {facilityNeighborhoodLabel(item)}
          {!item.location ? ' · Sem ponto no mapa' : ''}
        </AppText>
      </View>
      <Ionicons name="arrow-forward" size={17} color={colors.ink} />
    </Pressable>
  );
}
