export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: number;
}

export const slides: OnboardingSlide[] = [
  {
    id: 'territory',
    title: 'Conheça melhor seu bairro',
    description: 'Chamados do 1746 e serviços públicos no mapa do seu bairro.',
    image: require('@/assets/images/onboarding-territory.webp'),
  },
  {
    id: 'central-1746',
    title: 'O que é o 1746?',
    description: 'É a central da Prefeitura do Rio para pedir serviços. Aqui você vê os chamados que ela divulga.',
    image: require('@/assets/images/auth-backdrop.jpg'),
  },
  {
    id: 'save',
    title: 'Salve e acompanhe chamados',
    description: 'Guarde os chamados que importam e encontre os canais oficiais para pedir um serviço.',
    image: require('@/assets/images/onboarding-follow.webp'),
  },
];
