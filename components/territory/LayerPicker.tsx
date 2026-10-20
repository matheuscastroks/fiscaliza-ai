import React from 'react';
import { ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/useTheme';
import {
  facilityLabels,
  facilityIcons,
  type TerritoryLayer,
} from '@/features/territory/selectors';
export function LayerPicker({
  value,
  onChange,
}: {
  value: TerritoryLayer[];
  onChange: (next: TerritoryLayer[]) => void;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}
      style={{ marginHorizontal: -16 }}
    >
      {(['official', 'school', 'health', 'square'] as const).map((layer) => {
        const selected = value.includes(layer);
        return (
          <Pressable
            key={layer}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={
              layer === 'official' ? 'Chamados 1746' : facilityLabels[layer]
            }
            onPress={() =>
              onChange(
                selected ? value.filter((x) => x !== layer) : [...value, layer],
              )
            }
            style={{
              minHeight: 44,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              paddingHorizontal: 14,
              borderRadius: 24,
              backgroundColor: selected ? colors.ink : colors.surface,
            }}
          >
            <Ionicons
              name={
                layer === 'official' ? 'shield-outline' : facilityIcons[layer]
              }
              size={17}
              color={selected ? colors.canvas : colors.ink}
            />
            <AppText
              variant="caption"
              style={{ color: selected ? colors.canvas : colors.ink }}
            >
              {layer === 'official' ? 'Chamados' : facilityLabels[layer]}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
