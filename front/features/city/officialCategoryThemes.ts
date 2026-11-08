/**
 * Mapeamento visual das categorias de chamados oficiais (Central 1746)
 * com imagens de alta resolução (Unsplash) e gradientes otimizados.
 */

export interface ServiceCategoryTheme {
  id: string;
  label: string;
  icon: string;
  color: string;
  imageUrl: string;
}

export const OFFICIAL_CATEGORIES_THEMES: Record<string, ServiceCategoryTheme> = {
  lighting: {
    id: 'lighting',
    label: 'Iluminação',
    icon: 'bulb-outline',
    color: '#EAB308',
    imageUrl:
      'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
  },
  road: {
    id: 'road',
    label: 'Vias e Asfalto',
    icon: 'car-outline',
    color: '#F97316',
    imageUrl:
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
  },
  cleaning: {
    id: 'cleaning',
    label: 'Limpeza e Lixo',
    icon: 'trash-outline',
    color: '#10B981',
    imageUrl:
      'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
  },
  traffic: {
    id: 'traffic',
    label: 'Trânsito e Semáforo',
    icon: 'navigate-outline',
    color: '#EF4444',
    imageUrl:
      'https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?auto=format&fit=crop&w=800&q=80',
  },
  nature: {
    id: 'nature',
    label: 'Árvores e Ambiente',
    icon: 'leaf-outline',
    color: '#059669',
    imageUrl:
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
  },
  drainage: {
    id: 'drainage',
    label: 'Drenagem e Esgoto',
    icon: 'water-outline',
    color: '#0284C7',
    imageUrl:
      'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80',
  },
  health: {
    id: 'health',
    label: 'Saúde e Clínicas',
    icon: 'medkit-outline',
    color: '#DC2626',
    imageUrl:
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
  },
  social: {
    id: 'social',
    label: 'Cidadania e Social',
    icon: 'people-outline',
    color: '#6366F1',
    imageUrl:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
  },
  animals: {
    id: 'animals',
    label: 'Proteção Animal',
    icon: 'paw-outline',
    color: '#D97706',
    imageUrl:
      'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80',
  },
  transit: {
    id: 'transit',
    label: 'Transporte Público',
    icon: 'bus-outline',
    color: '#2563EB',
    imageUrl:
      'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80',
  },
  general: {
    id: 'general',
    label: 'Serviços Urbanos',
    icon: 'business-outline',
    color: '#0072BB',
    imageUrl:
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
  },
};

export interface CivicMacroTheme {
  id: string;
  label: string;
  icon: string;
  keywords: string[];
}

export const CIVIC_MACRO_THEMES: CivicMacroTheme[] = [
  { id: 'all', label: 'Todos', icon: 'grid-outline', keywords: [] },
  {
    id: 'road',
    label: 'Vias e Asfalto',
    icon: 'car-outline',
    keywords: ['buraco', 'asfalto', 'paviment', 'calçada', 'tapa-buraco', 'via pública'],
  },
  {
    id: 'lighting',
    label: 'Iluminação',
    icon: 'bulb-outline',
    keywords: ['luz', 'poste', 'ilumina', 'lâmpada', 'apagada'],
  },
  {
    id: 'cleaning',
    label: 'Limpeza e Lixo',
    icon: 'trash-outline',
    keywords: ['lixo', 'entulho', 'limpeza', 'comlurb', 'caçamba', 'coleta'],
  },
  {
    id: 'nature',
    label: 'Árvores e Praças',
    icon: 'leaf-outline',
    keywords: ['árvore', 'poda', 'praça', 'mato', 'arbóreo'],
  },
  {
    id: 'drainage',
    label: 'Drenagem e Esgoto',
    icon: 'water-outline',
    keywords: ['bueiro', 'esgoto', 'drenagem', 'alagamento', 'galeria'],
  },
  {
    id: 'traffic',
    label: 'Trânsito e Sinais',
    icon: 'navigate-outline',
    keywords: ['semáforo', 'sinal', 'trânsito', 'faixa', 'sinalização'],
  },
];

export function matchesMacroTheme(
  serviceType?: string | null,
  serviceSubtype?: string | null,
  macroThemeId?: string | null,
): boolean {
  if (!macroThemeId || macroThemeId === 'all') return true;
  const theme = resolveServiceCategoryTheme(serviceType, serviceSubtype);
  return theme.id === macroThemeId;
}

export function resolveServiceCategoryTheme(
  serviceType?: string | null,
  serviceSubtype?: string | null,
): ServiceCategoryTheme {
  const combined = `${serviceType || ''} ${serviceSubtype || ''}`.toLowerCase();

  if (
    combined.includes('ilumina') ||
    combined.includes('poste') ||
    combined.includes('lâmpada')
  ) {
    return OFFICIAL_CATEGORIES_THEMES.lighting;
  }
  if (
    combined.includes('estacionamento') ||
    combined.includes('veículo') ||
    combined.includes('paviment') ||
    combined.includes('buraco') ||
    combined.includes('asfalto') ||
    combined.includes('vias públicas')
  ) {
    return OFFICIAL_CATEGORIES_THEMES.road;
  }
  if (
    combined.includes('limpeza') ||
    combined.includes('lixo') ||
    combined.includes('remoção') ||
    combined.includes('entulho') ||
    combined.includes('coleta') ||
    combined.includes('contêiner') ||
    combined.includes('caçamba')
  ) {
    return OFFICIAL_CATEGORIES_THEMES.cleaning;
  }
  if (
    combined.includes('semáforo') ||
    combined.includes('sinal') ||
    combined.includes('trânsito') ||
    combined.includes('multa')
  ) {
    return OFFICIAL_CATEGORIES_THEMES.traffic;
  }
  if (
    combined.includes('árvore') ||
    combined.includes('arbóreo') ||
    combined.includes('ambiente') ||
    combined.includes('mata')
  ) {
    return OFFICIAL_CATEGORIES_THEMES.nature;
  }
  if (
    combined.includes('drenagem') ||
    combined.includes('esgoto') ||
    combined.includes('saneamento') ||
    combined.includes('alagamento') ||
    combined.includes('bueiro')
  ) {
    return OFFICIAL_CATEGORIES_THEMES.drainage;
  }
  if (
    combined.includes('saúde') ||
    combined.includes('clínica') ||
    combined.includes('hospital') ||
    combined.includes('sisreg') ||
    combined.includes('remédio')
  ) {
    return OFFICIAL_CATEGORIES_THEMES.health;
  }
  if (
    combined.includes('animal') ||
    combined.includes('cão') ||
    combined.includes('gato') ||
    combined.includes('roedor') ||
    combined.includes('caramujo')
  ) {
    return OFFICIAL_CATEGORIES_THEMES.animals;
  }
  if (
    combined.includes('ônibus') ||
    combined.includes('brt') ||
    combined.includes('transporte')
  ) {
    return OFFICIAL_CATEGORIES_THEMES.transit;
  }
  if (
    combined.includes('cadastro único') ||
    combined.includes('social') ||
    combined.includes('cidadão') ||
    combined.includes('sossego') ||
    combined.includes('alvará') ||
    combined.includes('iptu') ||
    combined.includes('obra')
  ) {
    return OFFICIAL_CATEGORIES_THEMES.social;
  }

  return OFFICIAL_CATEGORIES_THEMES.general;
}
