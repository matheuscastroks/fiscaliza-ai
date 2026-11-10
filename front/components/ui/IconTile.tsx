import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/useTheme';
import { layout } from '@/theme/layout';
import type { IconName } from './IconButton';

/** Ícone em quadrado suave (substitui os `iconSquircle` copiados por tela). */
export function IconTile({ icon, tone = 'primary' }: { icon: IconName; tone?: 'primary' | 'neutral' | 'risk' }) {
  const { colors } = useTheme();
  const { fg, bg } =
    tone === 'risk'
      ? { fg: colors.risk, bg: colors.riskSurface }
      : tone === 'neutral'
        ? { fg: colors.ink, bg: colors.surfaceSubdued }
        : { fg: colors.primary, bg: colors.primaryContainer };
  return (
    <View style={[styles.tile, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={layout.iconSize.md} color={fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: layout.touchTarget.minWidth - 8,
    height: layout.touchTarget.minHeight - 8,
    borderRadius: layout.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
