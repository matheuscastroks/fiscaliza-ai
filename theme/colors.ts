/**
 * Fiscaliza-AI — Tokens de Cores Semânticas (V2)
 * Sinalização & Registro Urbano. Base mineral com azul utilitário.
 * Verificado com contrastes WCAG AA/AAA.
 */

export const colors = {
  // Superfícies e Fundos
  canvas: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceSubdued: '#F4F5F5',

  // Tipografia e Conteúdo Factual
  ink: '#18232A',
  muted: '#4E5A61',
  subtle: '#7E8B92',

  // Estrutura e Separação
  divider: '#DCE1E2',
  border: '#DCE1E2',
  borderActive: '#176287',

  // Ação e Navegação Territorial
  accent: '#176287',
  accentPressed: '#104864',
  accentSoft: '#E8F2F7',

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
