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
    description: 'Com o Fiscaliza aí, você consulta chamados do 1746 e encontra serviços públicos no mapa do seu bairro.',
    image: require('@/assets/images/onboarding-territory.webp'),
  },
  {
    id: 'central-1746',
    title: 'O que é o 1746?',
    description: 'O 1746 é a central da Prefeitura do Rio para pedir serviços e acompanhar protocolos. O Fiscaliza aí mostra os chamados publicados pela central.',
    image: require('@/assets/images/auth-backdrop.jpg'),
  },
  {
    id: 'save',
    title: 'Salve e acompanhe chamados',
    description: 'Guarde os chamados que quer rever. A aba Agir reúne os canais oficiais para pedir um serviço.',
    image: require('@/assets/images/onboarding-follow.webp'),
  },
];
