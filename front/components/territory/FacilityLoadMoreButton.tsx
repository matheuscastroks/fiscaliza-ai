import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/useTheme';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';

export interface FacilityLoadMoreButtonProps {
  label: string;
  loadedCount: number;
  totalKnown: number | null;
  isFetching: boolean;
  onPress: () => void;
}

/** Continuação da paginação de equipamentos no mapa. */
export function FacilityLoadMoreButton({
  label,
  loadedCount,
  totalKnown,
  isFetching,
  onPress,
}: FacilityLoadMoreButtonProps) {
  const { colors } = useTheme();
  const count =
    totalKnown === null
      ? ''
      : ` (${loadedCount} de ${totalKnown.toLocaleString('pt-BR')})`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Carregar mais ${label}`}
      accessibilityState={{ disabled: isFetching, busy: isFetching }}
      disabled={isFetching}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name="add-circle-outline"
        size={18}
        color={colors.onSurfaceBrand}
      />
      <AppText variant="caption" style={styles.text}>
        {isFetching
          ? 'Carregando equipamentos...'
          : `Carregar mais ${label}${count}`}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: spacing.md,
    borderRadius: layout.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 5,
  },
  pressed: { opacity: 0.85 },
  text: { fontWeight: '700' },
});
