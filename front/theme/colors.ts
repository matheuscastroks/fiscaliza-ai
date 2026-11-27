/** Fiscaliza aí: semantic light/dark palettes (Azul-Petróleo Urbana). Photos and brand assets are never inverted. */
export const lightColors = {
  // Identidade de Marca e Ações
  primary: '#16576C',
  primaryContainer: '#E0EFF2',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#16576C',
  brandYellow: '#F4B400',
  onBrandYellow: '#192D35',
  onSurfaceBrand: '#16576C',
  onAccentBrand: '#F4B400',
  accent: '#16576C',
  accentPressed: '#0F3D4C',
  accentSoft: '#E0EFF2',
  onAccent: '#FFFFFF',
  onSelection: '#FFFFFF',
  darkPill: '#16576C',

  // Superfícies e Fundos
  canvas: '#F3F4F6',
  surfaceRecessed: '#E8EBEF',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceFloating: '#FFFFFF',
  surfaceSubdued: '#ECEEF1',
  divider: '#D6DAE0',
  dividerSubtle: '#DBDEE3',
  border: '#D6DAE0',
  borderActive: '#16576C',

  // Tipografia e Conteúdo (distinto da cor de marca)
  ink: '#20262B',
  muted: '#4F5B63',
  // AA (≥4,5:1) sobre canvas e surface.
  subtle: '#57636D',

  // Barra de Navegação Flutuante
  navigationSurface: '#FFFFFF',
  navigationSelection: '#D6E9EE',
  navigationOnSelection: '#16576C',
  navigationIcon: '#4F5B63',

  // Estados Semânticos
  destructive: '#9E3431',
  onDestructive: '#FFFFFF',
  risk: '#9E3431',
  riskSurface: '#FCEDEC',
  info: '#2D5A9B',
  infoSurface: '#E6EEF8',
  attention: '#835916',
  attentionSurface: '#F9F2E0',
  completed: '#236B50',
  completedSurface: '#E7F2EC',

  // Utilitários e overlays
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  scrim: 'rgba(0, 0, 0, 0.44)',
  glass: 'rgba(255, 255, 255, 0.94)',
  /** Faixa sob a barra de status quando o conteúdo é um mapa. */
  statusScrim: 'rgba(243, 244, 246, 0.92)',
  /** Fundo de aviso flutuante sobre o mapa (ex.: carregando). */
  floatingInk: 'rgba(25, 45, 53, 0.9)',
  onFloatingInk: '#FFFFFF',
  glassBorder: 'rgba(214, 218, 224, 0.72)',
  shadow: '#000000',
} as const;

export type ThemeColors = {
  readonly [Key in keyof typeof lightColors]: string;
};

export const darkColors: ThemeColors = {
  // Identidade de Marca e Ações (luminoso no escuro para contraste ideal)
  primary: '#79CBD5',
  primaryContainer: '#1A2C34',
  onPrimary: '#0E2A33',
  onPrimaryContainer: '#79CBD5',
  brandYellow: '#F4B400',
  onBrandYellow: '#192D35',
  onSurfaceBrand: '#F4B400',
  onAccentBrand: '#0E2A33',
  accent: '#79CBD5',
  accentPressed: '#63B5BF',
  accentSoft: '#1A2C34',
  onAccent: '#0E2A33',
  onSelection: '#0E2A33',
  darkPill: '#79CBD5',

  // Base grafite e superfícies elevadas progressivamente mais claras.
  canvas: '#121315',
  surfaceRecessed: '#0C0D0F',
  surface: '#1B1D21',
  surfaceRaised: '#25282D',
  surfaceFloating: '#2D3036',
  surfaceSubdued: '#22252A',
  divider: '#3A3E45',
  dividerSubtle: '#353940',
  border: '#3A3E45',
  borderActive: '#79CBD5',

  // Tipografia e Conteúdo
  ink: '#F3F4F6',
  muted: '#B8BEC6',
  subtle: '#A4ABB4',

  // Barra de Navegação Flutuante
  navigationSurface: '#2D3036',
  navigationSelection: '#164450',
  navigationOnSelection: '#A8E3EB',
  navigationIcon: '#D9DDE3',

  // Estados Semânticos
  destructive: '#9E3431',
  onDestructive: '#FFFFFF',
  risk: '#FFAAA5',
  riskSurface: '#3C2325',
  info: '#9DBCEB',
  infoSurface: '#1F2B3C',
  attention: '#EAC57E',
  attentionSurface: '#352D1E',
  completed: '#8ED5B1',
  completedSurface: '#1E342A',

  // Utilitários e overlays
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  scrim: 'rgba(0, 0, 0, 0.68)',
  glass: 'rgba(45, 48, 54, 0.96)',
  statusScrim: 'rgba(18, 19, 21, 0.88)',
  floatingInk: 'rgba(243, 244, 246, 0.94)',
  onFloatingInk: '#121315',
  glassBorder: 'rgba(243, 244, 246, 0.15)',
  shadow: '#000000',
};

/** @deprecated Use useTheme().colors in components and a colors factory argument in styles. */
export const colors: ThemeColors = lightColors;
