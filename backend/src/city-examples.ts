import { withExampleContent } from './example-content.js';
import type { Occurrence, Proposal } from '../../shared/contracts.js';

/** Presentation content only; real contributions are never replaced by these examples. */
export function cityExamples(at: string) {
  const ago = (days: number) =>
    new Date(new Date(at).getTime() - days * 86400000).toISOString();
  const definitions: {
    id: string;
    title: string;
    description: string;
    category: Occurrence['category'];
    status: Occurrence['status'];
    address: string;
    neighborhood: string;
    latitude: number;
    longitude: number;
    photo: string;
  }[] = [
    {
      id: 'occ-pavimento-assembleia',
      title: 'Pavimento danificado na Rua da Assembleia',
      description:
        'O revestimento está quebrado junto à passagem de pedestres. Ciclistas desviam para o fluxo dos carros.',
      category: 'road',
      status: 'pending',
      address: 'Rua da Assembleia, próximo à Rua do Carmo',
      neighborhood: 'Centro',
      latitude: -22.9044,
      longitude: -43.1768,
      photo: 'road',
    },
    {
      id: 'occ-coleta-uruguaiana',
      title: 'Resíduos acumulados junto à calçada',
      description:
        'Sacos de lixo permanecem no trecho de passagem após o horário habitual de coleta.',
      category: 'cleaning',
      status: 'in_progress',
      address: 'Rua Uruguaiana, próximo à Rua Sete de Setembro',
      neighborhood: 'Centro',
      latitude: -22.9038,
      longitude: -43.1813,
      photo: 'waste',
    },
    {
      id: 'occ-calcada-sete',
      title: 'Calçada irregular no caminho da praça',
      description:
        'O piso solto dificulta a circulação de pessoas com carrinhos e mobilidade reduzida.',
      category: 'road',
      status: 'pending',
      address: 'Rua Sete de Setembro, próximo à Avenida Passos',
      neighborhood: 'Centro',
      latitude: -22.9038,
      longitude: -43.183,
      photo: 'sidewalk',
    },
    {
      id: 'occ-sinal-praca-xv',
      title: 'Sinal de pedestres com tempo insuficiente',
      description:
        'A travessia termina antes de moradores com mobilidade reduzida alcançarem o outro lado.',
      category: 'others',
      status: 'in_progress',
      address: 'Praça XV, acesso à Rua Primeiro de Março',
      neighborhood: 'Centro',
      latitude: -22.903,
      longitude: -43.1744,
      photo: 'crossing',
    },
    {
      id: 'occ-banco-campo',
      title: 'Banco danificado no passeio da praça',
      description:
        'Uma das tábuas do banco está solta e impede o uso seguro do assento.',
      category: 'others',
      status: 'resolved',
      address: 'Campo de Santana, acesso pela Rua da Constituição',
      neighborhood: 'Centro',
      latitude: -22.9062,
      longitude: -43.19,
      photo: 'benches',
    },
    {
      id: 'occ-luz-gloria',
      title: 'Trecho sem iluminação no acesso à estação',
      description:
        'O caminho de pedestres está escuro no início da noite, dificultando a identificação dos desníveis.',
      category: 'lighting',
      status: 'pending',
      address: 'Rua da Glória, próximo ao acesso à estação',
      neighborhood: 'Glória',
      latitude: -22.9204,
      longitude: -43.1762,
      photo: 'gloria-dark',
    },
  ];
  const occurrences: Occurrence[] = definitions.map((entry, index) => ({
    id: entry.id,
    municipalityId: '3304557',
    title: entry.title,
    description: entry.description,
    category: entry.category,
    status: entry.status,
    priority: 'medium',
    location: {
      latitude: entry.latitude,
      longitude: entry.longitude,
      address: entry.address,
      neighborhood: entry.neighborhood,
    },
    images: ['/api/demo-media/' + entry.photo + '.jpg'],
    reportedBy: 'citizen-ana',
    reportedAt: ago(index + 1),
    votes: 0,
    comments: [],
    statusHistory: [
      {
        status: 'pending',
        source: 'citizen',
        at: ago(index + 1),
        justification: 'Registro recebido.',
        actor: 'Beatriz Arantes',
      },
      ...(entry.status !== 'pending'
        ? [
            {
              status: entry.status,
              source: 'management' as const,
              at: ago(0),
              actor: 'Equipe de Gestão',
              justification:
                entry.status === 'resolved'
                  ? 'Reparo concluído e disponibilizado para avaliação no local.'
                  : 'Vistoria encaminhada ao setor responsável.',
            },
          ]
        : []),
    ],
    ...(entry.status === 'resolved' ? { resolvedAt: ago(0) } : {}),
  }));
  const initiatives = [
    {
      id: 'proposal-travessia-praca-xv',
      title: 'Mais tempo para atravessar na Praça XV',
      body: 'Revisar o tempo semafórico considerando pessoas idosas e com mobilidade reduzida nos horários de maior circulação.',
      latitude: -22.903,
      longitude: -43.1744,
      neighborhood: 'Centro',
      address: 'Praça XV',
      photo: 'crossing-day',
      link: 'occ-sinal-praca-xv',
    },
    {
      id: 'proposal-coleta-centro',
      title: 'Pontos de coleta no trajeto do comércio',
      body: 'Organizar locais de descarte e horários de coleta junto aos comerciantes, mantendo a faixa de passagem livre.',
      latitude: -22.9038,
      longitude: -43.1813,
      neighborhood: 'Centro',
      address: 'Rua Uruguaiana',
      photo: 'recycling',
      link: 'occ-coleta-uruguaiana',
    },
    {
      id: 'proposal-descanso-campo',
      title: 'Assentos acessíveis e sombra no passeio',
      body: 'Distribuir bancos em trechos de descanso próximos à sombra, preservando o acesso de cadeiras de rodas e carrinhos.',
      latitude: -22.9062,
      longitude: -43.19,
      neighborhood: 'Centro',
      address: 'Campo de Santana',
      photo: 'park-path',
      link: 'occ-banco-campo',
    },
    {
      id: 'proposal-caminho-gloria',
      title: 'Caminho iluminado até a estação',
      body: 'Revisar a iluminação e a continuidade das calçadas no trajeto de moradores até a estação, começando pelos pontos de menor visibilidade.',
      latitude: -22.9204,
      longitude: -43.1762,
      neighborhood: 'Glória',
      address: 'Rua da Glória',
      photo: 'gloria-light',
      link: 'occ-luz-gloria',
    },
  ];
  const proposals: Proposal[] = initiatives.map((entry, index) => ({
    id: entry.id,
    municipalityId: '3304557',
    kind: 'proposal',
    title: entry.title,
    summary: entry.body,
    body: entry.body,
    neighborhood: entry.neighborhood,
    territory: {
      scope: 'location',
      neighborhood: entry.neighborhood,
      location: {
        latitude: entry.latitude,
        longitude: entry.longitude,
        address: entry.address,
      },
    },
    images: ['/api/demo-media/' + entry.photo + '.jpg'],
    createdBy: 'citizen-ana',
    createdAt: ago(index + 2),
    responsible: 'Secretaria de Serviços Urbanos',
    supports: 0,
    comments: [],
    linkedIds: [entry.link],
    status: index === 0 ? 'under_review' : 'submitted',
    history:
      index === 0
        ? [
            {
              at: ago(0),
              actor: 'Equipe de Gestão',
              from: 'submitted',
              to: 'under_review',
              text: 'Proposta recebida pela equipe de mobilidade para análise da travessia.',
            },
          ]
        : [],
  }));
  return {
    occurrences: occurrences.map(withExampleContent),
    proposals: proposals.map(withExampleContent),
  };
}
