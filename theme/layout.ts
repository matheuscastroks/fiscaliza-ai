import { Platform } from 'react-native';

/**
 * Fiscaliza-AI — Regras de Layout e Superfície (V2)
 */

export const layout = {
  radius: {
    xs: 4,
    button: 8,
    panel: 8,
    sheet: 16,
    pill: 9999,
  },
  borderWidth: {
    hairline: 1,
    focus: 2,
  },
  touchTarget: {
    minHeight: Platform.OS === 'ios' ? 44 : 48,
    minWidth: Platform.OS === 'ios' ? 44 : 48,
  },
} as const;

export type Layout = typeof layout;
