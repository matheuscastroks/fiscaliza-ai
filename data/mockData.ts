// Tipos de dados
import type { Municipality } from '@/shared/contracts';
import { rioDemoCitizens, rioDemoOccurrences } from '@/shared/rio-data';
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role?: 'citizen' | 'staff' | 'admin';
  sector?: string;
  municipality?: Municipality | null;
  postalCode?: string;
  neighborhood?: string;
  avatar?: string;
  level: number;
  points: number;
  ranking: number;
  badges: Badge[];
  createdAt: string;
  streak: number;
  lastActivity: string;
  totalComments: number;
  joinedDaysAgo: number;
  nextLevelPoints: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  progress: number;
  earnedAt?: string;
}

export interface Problem {
  views?: number;
  id: string;
  municipalityId?: string;
  title: string;
  description: string;
  category: 'road' | 'lighting' | 'cleaning' | 'others';
  status: 'pending' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  location: {
    latitude: number;
    longitude: number;
    address: string;
    neighborhood?: string;
  };
  images: string[];
  reportedBy: string; // userId
  reportedAt: string;
  resolvedAt?: string;
  votes: number;
  comments: Comment[];
  statusHistory?: {
    status: Problem['status'];
    at: string;
    justification: string;
  }[];
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: string;
}

// Dados mockados
export const demoUser: User = {
  id: 'demo-citizen',
  name: 'Pessoa de demonstração',
  email: 'demo@vilaesperanca.exemplo',
  password: 'demo',
  level: 1,
  points: 0,
  ranking: 0,
  badges: [],
  createdAt: '2026-09-10',
  streak: 0,
  lastActivity: '2026-09-10T09:00:00.000Z',
  totalComments: 0,
  joinedDaysAgo: 0,
  nextLevelPoints: 100,
};

export const mockUsers: User[] = [
  demoUser,
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    password: '123456',
    avatar:
      'https://videos.openai.com/vg-assets/assets%2Ftask_01jwwzbzctetdtyv1dhtwvmhx7%2F1749024148_img_1.webp?st=2025-06-05T02%3A40%3A00Z&se=2025-06-11T03%3A40%3A00Z&sks=b&skt=2025-06-05T02%3A40%3A00Z&ske=2025-06-11T03%3A40%3A00Z&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skoid=aa5ddad1-c91a-4f0a-9aca-e20682cc8969&skv=2019-02-02&sv=2018-11-09&sr=b&sp=r&spr=https%2Chttp&sig=EkuDElonD7iO2%2B1Cw2odkWoThdQo6Ucb%2B2LFBeF%2B7tE%3D&az=oaivgprodscus',
    level: 5,
    points: 1250,
    ranking: 47,
    badges: [
      {
        id: '1',
        name: 'Herói da Limpeza',
        description: 'Reportou 10 problemas de limpeza',
        icon: 'cleaning-services',
        color: '#9C27B0',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-10',
      },
      {
        id: '2',
        name: 'Guardião da Cidade',
        description: 'Reportou 25 problemas no total',
        icon: 'security',
        color: '#2196F3',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-15',
      },
      {
        id: '3',
        name: 'Observador de Iluminação',
        description: 'Reportou 5 problemas de iluminação',
        icon: 'lightbulb',
        color: '#FF9800',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-08',
      },
      {
        id: '4',
        name: 'Especialista em Vias',
        description: 'Reporte 15 problemas de vias públicas',
        icon: 'construction',
        color: '#F44336',
        earned: false,
        progress: 73,
      },
      {
        id: '5',
        name: 'Cidadão Exemplar',
        description: 'Reporte 50 problemas no total',
        icon: 'emoji-events',
        color: '#FFD700',
        earned: false,
        progress: 46,
      },
      {
        id: '6',
        name: 'Vigilante Noturno',
        description: 'Reporte problemas durante a madrugada',
        icon: 'nights-stay',
        color: '#673AB7',
        earned: false,
        progress: 0,
      },
    ],
    createdAt: '2023-12-01',
    streak: 7,
    lastActivity: '2024-01-15T14:30:00.000Z',
    totalComments: 12,
    joinedDaysAgo: 45,
    nextLevelPoints: 1500,
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    password: '123456',
    avatar: 'https://avatars.githubusercontent.com/u/49662686?v=4',
    level: 3,
    points: 820,
    ranking: 78,
    badges: [
      {
        id: '1',
        name: 'Herói da Limpeza',
        description: 'Reportou 10 problemas de limpeza',
        icon: 'cleaning-services',
        color: '#9C27B0',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-12',
      },
      {
        id: '3',
        name: 'Observador de Iluminação',
        description: 'Reportou 5 problemas de iluminação',
        icon: 'lightbulb',
        color: '#FF9800',
        earned: false,
        progress: 60,
      },
    ],
    createdAt: '2024-01-05',
    streak: 3,
    lastActivity: '2024-01-14T19:15:00.000Z',
    totalComments: 5,
    joinedDaysAgo: 10,
    nextLevelPoints: 1000,
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    email: 'carlos.oliveira@email.com',
    password: '123456',
    avatar: 'https://avatars.githubusercontent.com/u/49662686?v=4',
    level: 2,
    points: 450,
    ranking: 156,
    badges: [
      {
        id: '1',
        name: 'Herói da Limpeza',
        description: 'Reportou 10 problemas de limpeza',
        icon: 'cleaning-services',
        color: '#9C27B0',
        earned: false,
        progress: 30,
      },
    ],
    createdAt: '2024-01-18',
    streak: 1,
    lastActivity: '2024-01-12T16:20:00.000Z',
    totalComments: 2,
    joinedDaysAgo: 2,
    nextLevelPoints: 500,
  },
  {
    id: '4',
    name: 'Ana Paula Costa',
    email: 'ana.costa@email.com',
    password: '123456',
    level: 6,
    points: 1850,
    ranking: 12,
    badges: [
      {
        id: '1',
        name: 'Herói da Limpeza',
        description: 'Reportou 10 problemas de limpeza',
        icon: 'cleaning-services',
        color: '#9C27B0',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-05',
      },
      {
        id: '2',
        name: 'Guardião da Cidade',
        description: 'Reportou 25 problemas no total',
        icon: 'security',
        color: '#2196F3',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-10',
      },
      {
        id: '5',
        name: 'Cidadão Exemplar',
        description: 'Reporte 50 problemas no total',
        icon: 'emoji-events',
        color: '#FFD700',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-20',
      },
    ],
    createdAt: '2023-11-15',
    streak: 12,
    lastActivity: '2024-01-20T10:15:00.000Z',
    totalComments: 28,
    joinedDaysAgo: 65,
    nextLevelPoints: 2000,
  },
  {
    id: '5',
    name: 'Roberto Mendes',
    email: 'roberto.mendes@email.com',
    password: '123456',
    level: 7,
    points: 2150,
    ranking: 8,
    badges: [
      {
        id: '1',
        name: 'Herói da Limpeza',
        description: 'Reportou 10 problemas de limpeza',
        icon: 'cleaning-services',
        color: '#9C27B0',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-02',
      },
      {
        id: '2',
        name: 'Guardião da Cidade',
        description: 'Reportou 25 problemas no total',
        icon: 'security',
        color: '#2196F3',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-08',
      },
      {
        id: '4',
        name: 'Especialista em Vias',
        description: 'Reporte 15 problemas de vias públicas',
        icon: 'construction',
        color: '#F44336',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-18',
      },
      {
        id: '5',
        name: 'Cidadão Exemplar',
        description: 'Reporte 50 problemas no total',
        icon: 'emoji-events',
        color: '#FFD700',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-22',
      },
    ],
    createdAt: '2023-10-20',
    streak: 18,
    lastActivity: '2024-01-22T16:45:00.000Z',
    totalComments: 45,
    joinedDaysAgo: 85,
    nextLevelPoints: 2500,
  },
  {
    id: '6',
    name: 'Fernanda Lima',
    email: 'fernanda.lima@email.com',
    password: '123456',
    level: 4,
    points: 980,
    ranking: 35,
    badges: [
      {
        id: '1',
        name: 'Herói da Limpeza',
        description: 'Reportou 10 problemas de limpeza',
        icon: 'cleaning-services',
        color: '#9C27B0',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-14',
      },
      {
        id: '3',
        name: 'Observador de Iluminação',
        description: 'Reportou 5 problemas de iluminação',
        icon: 'lightbulb',
        color: '#FF9800',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-16',
      },
    ],
    createdAt: '2024-01-01',
    streak: 8,
    lastActivity: '2024-01-19T14:20:00.000Z',
    totalComments: 18,
    joinedDaysAgo: 20,
    nextLevelPoints: 1200,
  },
  {
    id: '7',
    name: 'Lucas Barbosa',
    email: 'lucas.barbosa@email.com',
    password: '123456',
    level: 8,
    points: 2980,
    ranking: 3,
    badges: [
      {
        id: '1',
        name: 'Herói da Limpeza',
        description: 'Reportou 10 problemas de limpeza',
        icon: 'cleaning-services',
        color: '#9C27B0',
        earned: true,
        progress: 100,
        earnedAt: '2023-12-15',
      },
      {
        id: '2',
        name: 'Guardião da Cidade',
        description: 'Reportou 25 problemas no total',
        icon: 'security',
        color: '#2196F3',
        earned: true,
        progress: 100,
        earnedAt: '2023-12-22',
      },
      {
        id: '3',
        name: 'Observador de Iluminação',
        description: 'Reportou 5 problemas de iluminação',
        icon: 'lightbulb',
        color: '#FF9800',
        earned: true,
        progress: 100,
        earnedAt: '2023-12-18',
      },
      {
        id: '4',
        name: 'Especialista em Vias',
        description: 'Reporte 15 problemas de vias públicas',
        icon: 'construction',
        color: '#F44336',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-05',
      },
      {
        id: '5',
        name: 'Cidadão Exemplar',
        description: 'Reporte 50 problemas no total',
        icon: 'emoji-events',
        color: '#FFD700',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-12',
      },
      {
        id: '6',
        name: 'Vigilante Noturno',
        description: 'Reporte problemas durante a madrugada',
        icon: 'nights-stay',
        color: '#673AB7',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-15',
      },
    ],
    createdAt: '2023-09-10',
    streak: 25,
    lastActivity: '2024-01-22T22:30:00.000Z',
    totalComments: 68,
    joinedDaysAgo: 125,
    nextLevelPoints: 3500,
  },
  {
    id: '8',
    name: 'Camila Rodrigues',
    email: 'camila.rodrigues@email.com',
    password: '123456',
    level: 9,
    points: 3850,
    ranking: 1,
    badges: [
      {
        id: '1',
        name: 'Herói da Limpeza',
        description: 'Reportou 10 problemas de limpeza',
        icon: 'cleaning-services',
        color: '#9C27B0',
        earned: true,
        progress: 100,
        earnedAt: '2023-11-10',
      },
      {
        id: '2',
        name: 'Guardião da Cidade',
        description: 'Reportou 25 problemas no total',
        icon: 'security',
        color: '#2196F3',
        earned: true,
        progress: 100,
        earnedAt: '2023-11-20',
      },
      {
        id: '3',
        name: 'Observador de Iluminação',
        description: 'Reportou 5 problemas de iluminação',
        icon: 'lightbulb',
        color: '#FF9800',
        earned: true,
        progress: 100,
        earnedAt: '2023-11-15',
      },
      {
        id: '4',
        name: 'Especialista em Vias',
        description: 'Reporte 15 problemas de vias públicas',
        icon: 'construction',
        color: '#F44336',
        earned: true,
        progress: 100,
        earnedAt: '2023-12-01',
      },
      {
        id: '5',
        name: 'Cidadão Exemplar',
        description: 'Reporte 50 problemas no total',
        icon: 'emoji-events',
        color: '#FFD700',
        earned: true,
        progress: 100,
        earnedAt: '2023-12-20',
      },
      {
        id: '6',
        name: 'Vigilante Noturno',
        description: 'Reporte problemas durante a madrugada',
        icon: 'nights-stay',
        color: '#673AB7',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-03',
      },
    ],
    createdAt: '2023-08-01',
    streak: 35,
    lastActivity: '2024-01-23T08:15:00.000Z',
    totalComments: 95,
    joinedDaysAgo: 165,
    nextLevelPoints: 4000,
  },
  {
    id: '9',
    name: 'Pedro Santos',
    email: 'pedro.santos@email.com',
    password: '123456',
    level: 8,
    points: 3200,
    ranking: 2,
    badges: [
      {
        id: '1',
        name: 'Herói da Limpeza',
        description: 'Reportou 10 problemas de limpeza',
        icon: 'cleaning-services',
        color: '#9C27B0',
        earned: true,
        progress: 100,
        earnedAt: '2023-10-05',
      },
      {
        id: '2',
        name: 'Guardião da Cidade',
        description: 'Reportou 25 problemas no total',
        icon: 'security',
        color: '#2196F3',
        earned: true,
        progress: 100,
        earnedAt: '2023-10-15',
      },
      {
        id: '4',
        name: 'Especialista em Vias',
        description: 'Reporte 15 problemas de vias públicas',
        icon: 'construction',
        color: '#F44336',
        earned: true,
        progress: 100,
        earnedAt: '2023-11-10',
      },
      {
        id: '5',
        name: 'Cidadão Exemplar',
        description: 'Reporte 50 problemas no total',
        icon: 'emoji-events',
        color: '#FFD700',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-01',
      },
    ],
    createdAt: '2023-09-01',
    streak: 28,
    lastActivity: '2024-01-22T19:45:00.000Z',
    totalComments: 72,
    joinedDaysAgo: 140,
    nextLevelPoints: 3500,
  },
  {
    id: '10',
    name: 'Juliana Ferreira',
    email: 'juliana.ferreira@email.com',
    password: '123456',
    level: 3,
    points: 750,
    ranking: 55,
    badges: [
      {
        id: '1',
        name: 'Herói da Limpeza',
        description: 'Reportou 10 problemas de limpeza',
        icon: 'cleaning-services',
        color: '#9C27B0',
        earned: false,
        progress: 80,
      },
      {
        id: '3',
        name: 'Observador de Iluminação',
        description: 'Reportou 5 problemas de iluminação',
        icon: 'lightbulb',
        color: '#FF9800',
        earned: true,
        progress: 100,
        earnedAt: '2024-01-18',
      },
    ],
    createdAt: '2024-01-10',
    streak: 5,
    lastActivity: '2024-01-21T15:30:00.000Z',
    totalComments: 8,
    joinedDaysAgo: 13,
    nextLevelPoints: 1000,
  },
];

export const mockProblems: Problem[] = [
  {
    id: '1',
    title: 'Buraco na Estrada do Galeão',
    description:
      'Buraco grande na pista causando problemas para veículos. O buraco tem aproximadamente 1 metro de diâmetro e está localizado próximo ao acesso ao Aeroporto Internacional Tom Jobim.',
    category: 'road',
    status: 'pending',
    priority: 'high',
    location: {
      latitude: -22.8088162,
      longitude: -43.1965648,
      address: 'Estrada do Galeão, 1200 - Galeão, Rio de Janeiro - RJ',
    },
    images: [
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkfiX6VxBp9L3GvGR69wKo7zUQv-l4N9vv-A&s',
      'https://www.conjur.com.br/wp-content/uploads/2024/12/damaged-american-road-surface-with-deep-pothole-ruined-street-urgent-need-repair-scaled.jpg',
    ],
    reportedBy: '1',
    reportedAt: '2024-01-15T14:30:00.000Z',
    votes: 8,
    comments: [
      {
        id: '1',
        text: 'Confirmado! Esse buraco está causando muitos problemas.',
        userId: '2',
        userName: 'Maria Santos',
        createdAt: '2024-01-15T16:45:00.000Z',
      },
      {
        id: '2',
        text: 'Já reportei para a prefeitura também.',
        userId: '3',
        userName: 'Carlos Oliveira',
        createdAt: '2024-01-16T09:20:00.000Z',
      },
    ],
  },
  {
    id: '2',
    title: 'Lâmpada Queimada - Rua Barata Ribeiro',
    description:
      'Poste de iluminação não está funcionando na Rua Barata Ribeiro, em Copacabana, deixando a área escura durante a noite e comprometendo a segurança dos pedestres.',
    category: 'lighting',
    status: 'in_progress',
    priority: 'medium',
    location: {
      latitude: -22.9711,
      longitude: -43.1822,
      address: 'Rua Barata Ribeiro, 203 - Copacabana, Rio de Janeiro - RJ',
    },
    images: [
      'https://www.clickguarulhos.com.br/wp-content/uploads/2019/07/20190730-lampada-queimada_palmira-rossi_recreio-sao-jorge-1.jpeg',
    ],
    reportedBy: '2',
    reportedAt: '2024-01-14T19:15:00.000Z',
    votes: 5,
    comments: [
      {
        id: '3',
        text: 'A prefeitura já foi notificada e está trabalhando na solução.',
        userId: '1',
        userName: 'João Silva',
        createdAt: '2024-01-15T11:30:00.000Z',
      },
    ],
  },
  {
    id: '3',
    title: 'Lixo Acumulado - Rua Visconde de Pirajá',
    description:
      'Acúmulo de lixo na calçada da Rua Visconde de Pirajá, em Ipanema. O lixo não foi coletado há vários dias e está atraindo insetos.',
    category: 'cleaning',
    status: 'resolved',
    priority: 'medium',
    location: {
      latitude: -22.9838,
      longitude: -43.2096,
      address: 'Rua Visconde de Pirajá, 456 - Ipanema, Rio de Janeiro - RJ',
    },
    images: [
      'https://www.correiodopovo.com.br/image/contentid/policy:1.835863:1677755916/lixoALS.jpeg.jpeg?a=2%3A1&$p$a=72124cc',
    ],
    reportedBy: '1',
    reportedAt: '2024-01-13T08:45:00.000Z',
    resolvedAt: '2024-01-14T14:20:00.000Z',
    votes: 12,
    comments: [
      {
        id: '4',
        text: 'Problema resolvido! Obrigado pela limpeza.',
        userId: '2',
        userName: 'Maria Santos',
        createdAt: '2024-01-14T15:00:00.000Z',
      },
    ],
  },
  {
    id: '4',
    title: 'Semáforo com Defeito - Rua Voluntários da Pátria',
    description:
      'Semáforo do cruzamento da Rua Voluntários da Pátria com Rua General Urquiza não está funcionando corretamente, criando risco de acidentes no trânsito intenso da região.',
    category: 'others',
    status: 'pending',
    priority: 'high',
    location: {
      latitude: -22.9519,
      longitude: -43.1773,
      address: 'Rua Voluntários da Pátria, 287 - Botafogo, Rio de Janeiro - RJ',
    },
    images: [
      'data:image/jpeg;base64,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',
    ],
    reportedBy: '3',
    reportedAt: '2024-01-12T16:20:00.000Z',
    votes: 15,
    comments: [
      {
        id: '5',
        text: 'Muito perigoso! Precisa ser consertado urgente.',
        userId: '1',
        userName: 'João Silva',
        createdAt: '2024-01-12T18:30:00.000Z',
      },
      {
        id: '6',
        text: 'Já liguei para o trânsito reportando.',
        userId: '2',
        userName: 'Maria Santos',
        createdAt: '2024-01-13T07:15:00.000Z',
      },
    ],
  },
  {
    id: '5',
    title: 'Calçada Danificada - Rua das Laranjeiras',
    description:
      'Calçada com buracos e rachaduras na Rua das Laranjeiras, em Laranjeiras, dificultando a passagem de pedestres, especialmente idosos e pessoas com mobilidade reduzida.',
    category: 'road',
    status: 'in_progress',
    priority: 'medium',
    location: {
      latitude: -22.9278,
      longitude: -43.1759,
      address: 'Rua das Laranjeiras, 170 - Laranjeiras, Rio de Janeiro - RJ',
    },
    images: [
      'https://portal-arquivos.engeplus.com.br/cache/noticia/geral/2012/calcada-danificada-e-responsabilidade-do-morador/calcada-danificada-e-responsabilidade-do-morador-933618.jpg',
    ],
    reportedBy: '2',
    reportedAt: '2024-01-11T10:30:00.000Z',
    votes: 7,
    comments: [],
  },
  {
    id: '6',
    title: 'Lixo Acumulado - Rua Almirante Alexandrino',
    description:
      'Grande acúmulo de lixo na esquina da Rua Almirante Alexandrino com Rua Paschoal Carlos Magno. O lixo está espalhado pela calçada há mais de uma semana, atraindo ratos e insetos.',
    category: 'cleaning',
    status: 'pending',
    priority: 'high',
    location: {
      latitude: -22.913,
      longitude: -43.1887,
      address:
        'Rua Almirante Alexandrino, 245 - Santa Teresa, Rio de Janeiro - RJ',
    },
    images: [
      'https://www.correiodopovo.com.br/image/contentid/policy:1.835863:1677755916/lixoALS.jpeg.jpeg?a=2%3A1&$p$a=72124cc',
    ],
    reportedBy: '4',
    reportedAt: '2024-01-20T09:15:00.000Z',
    votes: 18,
    comments: [
      {
        id: '7',
        text: 'Situação crítica! Precisa ser resolvido urgente.',
        userId: '5',
        userName: 'Roberto Mendes',
        createdAt: '2024-01-20T12:30:00.000Z',
      },
      {
        id: '8',
        text: 'Já entrei em contato com a Comlurb.',
        userId: '8',
        userName: 'Camila Rodrigues',
        createdAt: '2024-01-21T08:15:00.000Z',
      },
    ],
  },
  {
    id: '7',
    title: 'Poste de Luz Quebrado - Rua Conde de Bonfim',
    description:
      'Poste de iluminação pública danificado após temporal. O poste está inclinado e representa risco de queda, além de deixar a rua completamente escura.',
    category: 'lighting',
    status: 'pending',
    priority: 'high',
    location: {
      latitude: -22.9249,
      longitude: -43.2311,
      address: 'Rua Conde de Bonfim, 890 - Tijuca, Rio de Janeiro - RJ',
    },
    images: [
      'https://www.clickguarulhos.com.br/wp-content/uploads/2019/07/20190730-lampada-queimada_palmira-rossi_recreio-sao-jorge-1.jpeg',
    ],
    reportedBy: '7',
    reportedAt: '2024-01-19T21:45:00.000Z',
    votes: 22,
    comments: [
      {
        id: '9',
        text: 'Muito perigoso! Reportei para a Light também.',
        userId: '6',
        userName: 'Fernanda Lima',
        createdAt: '2024-01-20T07:20:00.000Z',
      },
    ],
  },
  {
    id: '8',
    title: 'Buraco na Av. das Américas',
    description:
      'Buraco profundo na via principal da Barra da Tijuca, próximo ao Shopping Barra. O buraco está causando danos aos veículos e é um risco constante para os motoristas.',
    category: 'road',
    status: 'in_progress',
    priority: 'high',
    location: {
      latitude: -23.0045,
      longitude: -43.3198,
      address: 'Av. das Américas, 1450 - Barra da Tijuca, Rio de Janeiro - RJ',
    },
    images: [
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkfiX6VxBp9L3GvGR69wKo7zUQv-l4N9vv-A&s',
    ],
    reportedBy: '9',
    reportedAt: '2024-01-18T14:20:00.000Z',
    votes: 31,
    comments: [
      {
        id: '10',
        text: 'Furei o pneu do meu carro nesse buraco!',
        userId: '10',
        userName: 'Juliana Ferreira',
        createdAt: '2024-01-19T09:45:00.000Z',
      },
      {
        id: '11',
        text: 'CET-Rio já foi notificada, obra deve começar semana que vem.',
        userId: '7',
        userName: 'Lucas Barbosa',
        createdAt: '2024-01-20T16:30:00.000Z',
      },
    ],
  },
  {
    id: '9',
    title: 'Entulho Abandonado - Estrada dos Bandeirantes',
    description:
      'Entulho de construção abandonado na calçada há mais de 15 dias. O material está obstruindo a passagem de pedestres e acumulando água parada.',
    category: 'cleaning',
    status: 'pending',
    priority: 'medium',
    location: {
      latitude: -23.0212,
      longitude: -43.437,
      address:
        'Estrada dos Bandeirantes, 567 - Recreio dos Bandeirantes, Rio de Janeiro - RJ',
    },
    images: [
      'https://www.correiodopovo.com.br/image/contentid/policy:1.835863:1677755916/lixoALS.jpeg.jpeg?a=2%3A1&$p$a=72124cc',
    ],
    reportedBy: '5',
    reportedAt: '2024-01-17T16:10:00.000Z',
    votes: 13,
    comments: [],
  },
  {
    id: '10',
    title: 'Sinalização Apagada - Rua da Carioca',
    description:
      'Placa de sinalização de trânsito completamente desbotada e ilegível no Centro da cidade. Motoristas estão confusos sobre as direções.',
    category: 'others',
    status: 'pending',
    priority: 'medium',
    location: {
      latitude: -22.9035,
      longitude: -43.1776,
      address: 'Rua da Carioca, 100 - Centro, Rio de Janeiro - RJ',
    },
    images: [],
    reportedBy: '8',
    reportedAt: '2024-01-16T11:30:00.000Z',
    votes: 9,
    comments: [
      {
        id: '12',
        text: 'Confirmado! A placa está realmente ilegível.',
        userId: '4',
        userName: 'Ana Paula Costa',
        createdAt: '2024-01-17T08:15:00.000Z',
      },
    ],
  },
  {
    id: '11',
    title: 'Esgoto Vazando - Boulevard Vinte e Oito de Setembro',
    description:
      'Vazamento de esgoto na rede subterrânea está causando mau cheiro e poças de água suja na rua. Situação insalubre para os moradores.',
    category: 'others',
    status: 'in_progress',
    priority: 'high',
    location: {
      latitude: -22.9154,
      longitude: -43.2402,
      address:
        'Boulevard Vinte e Oito de Setembro, 123 - Vila Isabel, Rio de Janeiro - RJ',
    },
    images: [],
    reportedBy: '6',
    reportedAt: '2024-01-15T07:45:00.000Z',
    votes: 25,
    comments: [
      {
        id: '13',
        text: 'CEDAE foi acionada e está trabalhando no reparo.',
        userId: '9',
        userName: 'Pedro Santos',
        createdAt: '2024-01-16T14:20:00.000Z',
      },
    ],
  },
  {
    id: '12',
    title: 'Árvore Caída - Rua Barão de Mesquita',
    description:
      'Árvore de grande porte caiu durante o temporal e está bloqueando totalmente a passagem na rua. Risco de acidentes e impedimento do trânsito local.',
    category: 'others',
    status: 'resolved',
    priority: 'high',
    location: {
      latitude: -22.9309,
      longitude: -43.2577,
      address: 'Rua Barão de Mesquita, 456 - Andaraí, Rio de Janeiro - RJ',
    },
    images: [],
    reportedBy: '10',
    reportedAt: '2024-01-14T18:20:00.000Z',
    resolvedAt: '2024-01-15T10:30:00.000Z',
    votes: 8,
    comments: [
      {
        id: '14',
        text: 'Problema resolvido! Equipe da Prefeitura removeu a árvore.',
        userId: '7',
        userName: 'Lucas Barbosa',
        createdAt: '2024-01-15T11:00:00.000Z',
      },
    ],
  },
  {
    id: '13',
    title: 'Calçada Irregular - Rua Souza Franco',
    description:
      'Calçada com desnível perigoso e pedras soltas próximo à escola municipal. Crianças e idosos estão em risco de quedas.',
    category: 'road',
    status: 'pending',
    priority: 'medium',
    location: {
      latitude: -22.9278,
      longitude: -43.2577,
      address: 'Rua Souza Franco, 345 - Grajaú, Rio de Janeiro - RJ',
    },
    images: [
      'https://portal-arquivos.engeplus.com.br/cache/noticia/geral/2012/calcada-danificada-e-responsabilidade-do-morador/calcada-danificada-e-responsabilidade-do-morador-933618.jpg',
    ],
    reportedBy: '4',
    reportedAt: '2024-01-13T13:15:00.000Z',
    votes: 16,
    comments: [
      {
        id: '15',
        text: 'Minha avó já tropeçou aí duas vezes!',
        userId: '3',
        userName: 'Carlos Oliveira',
        createdAt: '2024-01-14T09:30:00.000Z',
      },
    ],
  },
  {
    id: '14',
    title: 'Lâmpadas Queimadas - Rua Thomás Coelho',
    description:
      'Sequência de 5 lâmpadas de poste queimadas deixando todo o quarteirão no escuro. Área se tornou insegura durante a noite.',
    category: 'lighting',
    status: 'pending',
    priority: 'high',
    location: {
      latitude: -22.9027,
      longitude: -43.2783,
      address: 'Rua Thomás Coelho, 678 - Méier, Rio de Janeiro - RJ',
    },
    images: [
      'https://www.clickguarulhos.com.br/wp-content/uploads/2019/07/20190730-lampada-queimada_palmira-rossi_recreio-sao-jorge-1.jpeg',
    ],
    reportedBy: '9',
    reportedAt: '2024-01-12T20:30:00.000Z',
    votes: 28,
    comments: [
      {
        id: '16',
        text: 'Situação muito perigosa! Área completamente escura.',
        userId: '8',
        userName: 'Camila Rodrigues',
        createdAt: '2024-01-13T06:45:00.000Z',
      },
      {
        id: '17',
        text: 'Já reportei para a Light. Aguardando resposta.',
        userId: '5',
        userName: 'Roberto Mendes',
        createdAt: '2024-01-14T11:15:00.000Z',
      },
    ],
  },
  {
    id: '15',
    title: 'Ponto de Ônibus Destruído - Estrada de Jacarepaguá',
    description:
      'Abrigo do ponto de ônibus foi vandalizado e está completamente destruído. Passageiros ficam expostos ao sol e chuva.',
    category: 'others',
    status: 'pending',
    priority: 'medium',
    location: {
      latitude: -22.9388,
      longitude: -43.3677,
      address:
        'Estrada de Jacarepaguá, 1890 - Jacarepaguá, Rio de Janeiro - RJ',
    },
    images: [],
    reportedBy: '6',
    reportedAt: '2024-01-11T08:20:00.000Z',
    votes: 11,
    comments: [],
  },
  {
    id: '16',
    title: 'Buraco na Rua Quintino Bocaiúva',
    description:
      'Buraco grande na pista da Rua Quintino Bocaiúva, próximo ao número 500. O buraco está causando problemas para veículos e pedestres.',
    category: 'road',
    status: 'pending',
    priority: 'high',
    location: {
      latitude: -22.8765,
      longitude: -43.3123,
      address: 'Rua Quintino Bocaiúva, 500 - Quintino, Rio de Janeiro - RJ',
    },
    images: [
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkfiX6VxBp9L3GvGR69wKo7zUQv-l4N9vv-A&s',
    ],
    reportedBy: '1',
    reportedAt: '2024-01-22T14:30:00.000Z',
    votes: 12,
    comments: [
      {
        id: '18',
        text: 'Já reportei para a CET-Rio também.',
        userId: '2',
        userName: 'Maria Santos',
        createdAt: '2024-01-22T15:45:00.000Z',
      },
    ],
  },
  {
    id: '17',
    title: 'Lâmpadas Queimadas - Rua Madureira',
    description:
      'Sequência de 3 postes de iluminação não estão funcionando na Rua Madureira, deixando a área escura e insegura durante a noite.',
    category: 'lighting',
    status: 'in_progress',
    priority: 'medium',
    location: {
      latitude: -22.8845,
      longitude: -43.3375,
      address: 'Rua Madureira, 300 - Madureira, Rio de Janeiro - RJ',
    },
    images: [
      'https://www.clickguarulhos.com.br/wp-content/uploads/2019/07/20190730-lampada-queimada_palmira-rossi_recreio-sao-jorge-1.jpeg',
    ],
    reportedBy: '3',
    reportedAt: '2024-01-21T19:15:00.000Z',
    votes: 8,
    comments: [
      {
        id: '19',
        text: 'Light já foi notificada e está trabalhando na solução.',
        userId: '4',
        userName: 'Ana Paula Costa',
        createdAt: '2024-01-22T10:30:00.000Z',
      },
    ],
  },
  {
    id: '18',
    title: 'Lixo Acumulado - Rua Senador Camará',
    description:
      'Acúmulo de lixo na Rua Senador Camará, em Campo Grande. O lixo não foi coletado há vários dias e está atraindo insetos e roedores.',
    category: 'cleaning',
    status: 'pending',
    priority: 'high',
    location: {
      latitude: -22.9056,
      longitude: -43.5611,
      address: 'Rua Senador Camará, 456 - Campo Grande, Rio de Janeiro - RJ',
    },
    images: [
      'https://www.correiodopovo.com.br/image/contentid/policy:1.835863:1677755916/lixoALS.jpeg.jpeg?a=2%3A1&$p$a=72124cc',
    ],
    reportedBy: '5',
    reportedAt: '2024-01-20T08:45:00.000Z',
    votes: 15,
    comments: [
      {
        id: '20',
        text: 'Situação crítica! Precisa ser resolvido urgente.',
        userId: '6',
        userName: 'Fernanda Lima',
        createdAt: '2024-01-20T12:30:00.000Z',
      },
    ],
  },
  {
    id: '19',
    title: 'Calçada Danificada - Rua Fonseca Teles',
    description:
      'Calçada com buracos e desníveis na Rua Fonseca Teles, em Bangu. Dificultando a passagem de pedestres, especialmente idosos.',
    category: 'road',
    status: 'pending',
    priority: 'medium',
    location: {
      latitude: -22.8707,
      longitude: -43.4677,
      address: 'Rua Fonseca Teles, 150 - Bangu, Rio de Janeiro - RJ',
    },
    images: [
      'https://portal-arquivos.engeplus.com.br/cache/noticia/geral/2012/calcada-danificada-e-responsabilidade-do-morador/calcada-danificada-e-responsabilidade-do-morador-933618.jpg',
    ],
    reportedBy: '7',
    reportedAt: '2024-01-19T11:20:00.000Z',
    votes: 9,
    comments: [],
  },
  {
    id: '20',
    title: 'Semáforo com Defeito - Rua Braz de Pina',
    description:
      'Semáforo do cruzamento da Rua Braz de Pina com Av. Brasil não está funcionando corretamente, criando risco de acidentes.',
    category: 'others',
    status: 'in_progress',
    priority: 'high',
    location: {
      latitude: -22.8364,
      longitude: -43.2739,
      address: 'Rua Braz de Pina, 200 - Penha, Rio de Janeiro - RJ',
    },
    images: [],
    reportedBy: '8',
    reportedAt: '2024-01-18T16:30:00.000Z',
    votes: 20,
    comments: [
      {
        id: '21',
        text: 'CET-Rio já foi notificada e está trabalhando no reparo.',
        userId: '9',
        userName: 'Pedro Santos',
        createdAt: '2024-01-19T09:15:00.000Z',
      },
    ],
  },
];

// Estatísticas globais
export const mockStats = {
  totalProblems: mockProblems.length,
  resolvedProblems: mockProblems.filter((p) => p.status === 'resolved').length,
  pendingProblems: mockProblems.filter((p) => p.status === 'pending').length,
  inProgressProblems: mockProblems.filter((p) => p.status === 'in_progress')
    .length,
  totalUsers: mockUsers.length,
  activeUsers: mockUsers.filter((u) => u.points > 0).length,
};
