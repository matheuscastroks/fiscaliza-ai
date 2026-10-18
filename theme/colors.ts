/**
 * Paleta da referência fornecida pelo usuário: Instrument Sans, ônix e branco.
 */

export const colors = {
  // Superfícies e Fundos (Paleta #F5F6F7 da referência)
  canvas: '#F5F6F7',
  surface: '#FFFFFF',
  surfaceSubdued: '#ECEEF0',

  // Tipografia e Conteúdo Factual (Ônix #212529 da referência)
  ink: '#212529',
  muted: '#60666C',
  subtle: '#676D73',

  // Estrutura e Separação
  divider: '#E5E8EB',
  border: '#E5E8EB',
  borderActive: '#212529',

  // Elementos de Destaque da Referência
  darkPill: '#212529',

  // Ação e Navegação Territorial
  accent: '#212529',
  accentPressed: '#383D42',
  accentSoft: '#ECEEF0',

  // Estados Semânticos de Ocorrência e Sistema
  risk: '#9E3431',
  riskSurface: '#FCEDEC',
  attention: '#835916',
  attentionSurface: '#F9F2E0',
  completed: '#236B50',
  completedSurface: '#E7F2EC',

  // Neutro Operacional
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ThemeColors = typeof colors;
