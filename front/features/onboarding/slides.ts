import type { Ionicons } from '@expo/vector-icons';

interface OnboardingBenefit {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

export interface OnboardingSlide {
  id: string;
  badge: string;
  badgeIcon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  image: number;
  imageAlt: string;
  benefits: OnboardingBenefit[];
}

export const slides: OnboardingSlide[] = [
  {
    id: 'territory',
    badge: 'Explorar',
    badgeIcon: 'map-outline',
    title: 'Veja o que o 1746 publicou perto de você',
    description:
      'Explore no mapa os chamados registrados na sua região e encontre escolas, postos de saúde e praças. Os dados são oficiais e têm data de atualização.',
    image: require('@/assets/images/onboarding-territory.webp'),
    imageAlt: 'Vista da cidade do Rio de Janeiro com montanhas e ruas ensolaradas',
    benefits: [
      {
        icon: 'locate-outline',
        title: 'Chamados por bairro ou perto de você',
        description: 'Escolha um bairro ou um lugar seu e veja só o que está por perto.',
      },
      {
        icon: 'business-outline',
        title: 'Serviços públicos',
        description: 'Consulte endereço e contato de escolas, saúde e praças.',
      },
    ],
  },
  {
    id: 'save',
    badge: 'Salvar e agir',
    badgeIcon: 'bookmark-outline',
    title: 'Salve chamados e ache o canal oficial',
    description:
      'Guarde os chamados que importam para voltar a eles. Para abrir um novo, o app leva você ao atendimento oficial da Prefeitura; o envio é sempre feito por você.',
    image: require('@/assets/images/onboarding-follow.webp'),
    imageAlt: 'Espaço urbano no Rio de Janeiro com calçada de pedras portuguesas e arborização',
    benefits: [
      {
        icon: 'time-outline',
        title: 'Situação e prazo',
        description: 'Veja o protocolo, as datas e o prazo que a Prefeitura informou.',
      },
      {
        icon: 'chatbubbles-outline',
        title: 'Canais oficiais reunidos',
        description: 'Telefone 1746, WhatsApp e portal da Prefeitura em um só lugar.',
      },
    ],
  },
];

