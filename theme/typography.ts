import { TextStyle, Platform } from 'react-native';

/**
 * Fiscaliza-AI — Escala Tipográfica (V2)
 * Tipografia nativa e legível para formulários e fichas territoriais.
 */

export const typography: Record<string, TextStyle> = {
  screenTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  label: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  protocol: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
};

export type TypographyVariant = keyof typeof typography;
