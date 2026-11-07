import React, { useMemo } from 'react';
import { ScrollView, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AppSelect } from '@/components/ui/AppSelect';
import { layout, spacing, useTheme } from '@/theme';

export interface CategoryChipItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  queryValue: string;
}

export const TOP_CATEGORIES: CategoryChipItem[] = [
  { id: 'all', label: 'Todos', icon: 'sparkles-outline', queryValue: 'all' },
  { id: 'lighting', label: 'Iluminação', icon: 'bulb-outline', queryValue: 'Iluminação Pública' },
  { id: 'road', label: 'Asfalto e Vias', icon: 'car-outline', queryValue: 'Vias Públicas' },
  { id: 'cleaning', label: 'Lixo e Limpeza', icon: 'trash-outline', queryValue: 'Limpeza Urbana' },
  { id: 'nature', label: 'Poda e Praças', icon: 'leaf-outline', queryValue: 'Conservação de Parques e Áreas Verdes' },
  { id: 'traffic', label: 'Trânsito e Sinais', icon: 'navigate-outline', queryValue: 'Trânsito' },
];

export function CategoryChips({
  value,
  onChange,
  dynamicTypes = [],
}: {
  value: string;
  onChange: (type: string) => void;
  dynamicTypes?: string[];
}) {
  const { colors, isDark } = useTheme();

  // Check if current value is one of the top categories
  const isTopCategory = useMemo(() => {
    if (!value || value === 'all') return true;
    return TOP_CATEGORIES.some(
      (c) => c.queryValue.toLowerCase() === value.toLowerCase()
    );
  }, [value]);

  // Extract all other categories that aren't in the top 5
  const otherOptions = useMemo(() => {
    const set = new Set<string>();
    const topValues = new Set(
      TOP_CATEGORIES.map((c) => c.queryValue.toLowerCase())
    );

    dynamicTypes.forEach((t) => {
      const lower = t.trim().toLowerCase();
      if (!topValues.has(lower) && lower !== 'todos' && lower !== 'all') {
        set.add(t.trim());
      }
    });

    const list = Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return list.map((t) => ({ value: t, label: t }));
  }, [dynamicTypes]);

  const customCategoryValue = !isTopCategory ? value : '';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* Top 5 Categorias + Todos como Chips Rápidos */}
      {TOP_CATEGORIES.map((item) => {
        const isSelected =
          isTopCategory &&
          (value === item.queryValue ||
            (item.queryValue === 'all' && (value === 'all' || !value)));

        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.queryValue)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Filtrar por ${item.label}`}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected
                  ? colors.ink
                  : isDark
                  ? colors.surfaceSubdued
                  : colors.surface,
                borderColor: isSelected ? colors.ink : colors.border,
              },
            ]}
          >
            <Ionicons
              name={item.icon}
              size={15}
              color={isSelected ? colors.onAccentBrand : colors.muted}
            />
            <AppText
              variant="caption"
              style={[
                styles.label,
                {
                  color: isSelected ? colors.canvas : colors.ink,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
            >
              {item.label}
            </AppText>
          </Pressable>
        );
      })}

      {/* Select para o restante das categorias */}
      {otherOptions.length > 0 && (
        <View style={styles.selectWrap}>
          <AppSelect
            compact
            label="Mais categorias"
            placeholder="Buscar outra categoria..."
            options={otherOptions}
            value={customCategoryValue}
            onChange={(selected) => {
              if (selected) {
                onChange(selected);
              }
            }}
          />
        </View>
      )}
    </ScrollView>
  );
}

const pillRadius = layout?.radius?.pill || 9999;

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    paddingVertical: 2,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: pillRadius,
    borderWidth: 1,
  },
  selectWrap: {
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
  },
});
