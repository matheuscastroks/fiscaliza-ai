import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { normalizeNeighborhood } from '@/shared/civic-territory';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function NeighborhoodPicker({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const labels =
    value &&
    !options.some(
      (option) =>
        normalizeNeighborhood(option) === normalizeNeighborhood(value),
    )
      ? [value, ...options]
      : options;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -spacing.contentPadding }}
      contentContainerStyle={{
        gap: spacing.xs,
        paddingHorizontal: spacing.contentPadding,
      }}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel="Filtrar por bairro"
    >
      {['', ...labels].map((option) => {
        const selected =
          normalizeNeighborhood(option) === normalizeNeighborhood(value);
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityLabel={option || 'Todo o município'}
            accessibilityState={{ selected }}
            aria-pressed={selected}
            onPress={() => onChange(option)}
            style={{
              minHeight: 48,
              justifyContent: 'center',
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: spacing.xl,
              backgroundColor: selected ? colors.darkPill : colors.surface,
              borderColor: selected ? colors.darkPill : colors.divider,
              borderWidth: 1,
            }}
          >
            <AppText
              variant="label"
              style={{ color: selected ? colors.white : colors.ink }}
            >
              {option || 'Todo o município'}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
