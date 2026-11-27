import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import type { ElevationLevel } from '@/theme/elevation';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';

export type SurfaceTone = 'surface' | 'subdued' | 'recessed' | 'raised' | 'floating';

export interface SurfaceProps extends ViewProps {
  /** `card` para conteúdo; `panel` para blocos maiores. Não aninhe Surface. */
  radius?: 'card' | 'panel';
  padded?: boolean;
  /** Nível de elevação direcional (`boxShadow`). Padrão: `subtle`. */
  elevation?: ElevationLevel;
  /** Camada tonal de fundo. Padrão: `surface`. */
  tone?: SurfaceTone;
  /** Quando `true`, aplica `overflow: 'hidden'` em um nó interno para não recortar a sombra externa. */
  clipContent?: boolean;
}

const TONE_COLOR_KEY: Record<SurfaceTone, keyof ThemeColors> = {
  surface: 'surface',
  subdued: 'surfaceSubdued',
  recessed: 'surfaceRecessed',
  raised: 'surfaceRaised',
  floating: 'surfaceFloating',
};

export function Surface({
  radius = 'panel',
  padded = true,
  elevation: elevationLevel = 'subtle',
  tone = 'surface',
  clipContent = false,
  style,
  children,
  ...rest
}: SurfaceProps) {
  const { colors, elevation } = useTheme();
  const styles = useThemedStyles(createStyles);
  const radiusStyle = radius === 'card' ? styles.card : styles.panel;
  const surfaceStyle = {
    backgroundColor: colors[TONE_COLOR_KEY[tone]],
    ...elevation[elevationLevel],
  };

  if (clipContent) {
    return (
      <View style={[radiusStyle, surfaceStyle, style]} {...rest}>
        <View style={[radiusStyle, styles.clip, padded && styles.padded]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[radiusStyle, surfaceStyle, padded && styles.padded, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const createStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    clip: { overflow: 'hidden' },
    card: { borderRadius: layout.radius.card },
    panel: { borderRadius: layout.radius.panel },
    padded: { padding: spacing.md },
  });
