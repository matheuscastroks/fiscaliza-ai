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
  const { colors, elevation } = useTheme();
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
        elevation.floating,
        { backgroundColor: colors.surfaceFloating },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name="add-circle-outline"
        size={layout.iconSize.md}
        color={colors.primary}
      />
      <AppText variant="caption" style={styles.text}>
        {isFetching
          ? 'Carregando serviços…'
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
    minHeight: layout.touchTarget.minHeight,
    paddingHorizontal: spacing.md,
    borderRadius: layout.radius.control,
  },
  pressed: { opacity: 0.85 },
  text: { fontWeight: '600' },
});
