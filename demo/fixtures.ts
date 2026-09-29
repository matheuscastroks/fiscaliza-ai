import type { DemoProblem, DemoScenario, StatusChange } from './types';

export const DEMO_PRIMARY_ID = 'demo-001';
export const DEMO_SCENARIOS: DemoScenario[] = ['registered', 'in_progress', 'resolved'];

const initial: StatusChange = { status: 'pending', at: '2026-09-10T09:00:00.000Z', justification: 'Relato recebido para triagem.' };
const progress: StatusChange = { status: 'in_progress', at: '2026-09-11T14:00:00.000Z', justification: 'Equipe de manutenção designada.' };
const resolved: StatusChange = { status: 'resolved', at: '2026-09-12T16:30:00.000Z', justification: 'Reparo concluído e vistoriado.' };

export function createScenarioFixtures(scenario: DemoScenario): DemoProblem[] {
  const statusHistory = scenario === 'registered' ? [initial] : scenario === 'in_progress' ? [initial, progress] : [initial, progress, resolved];
  return JSON.parse(JSON.stringify([
    {
      id: DEMO_PRIMARY_ID,
      title: 'Buraco na Rua das Palmeiras',
      description: 'Buraco na pista junto à faixa de pedestres, próximo ao número 120.',
      category: 'road', status: statusHistory.at(-1)!.status, priority: 'high',
      location: { latitude: -22.903, longitude: -43.185, address: 'Rua das Palmeiras, 120 — Vila Esperança' },
      images: [], reportedBy: 'demo-citizen', reportedAt: initial.at,
      resolvedAt: scenario === 'resolved' ? resolved.at : undefined,
      votes: 8, comments: [], statusHistory,
    },
    {
      id: 'demo-002', title: 'Poste apagado na praça',
      description: 'Iluminação pública apagada no acesso principal da praça.',
      category: 'lighting', status: 'in_progress', priority: 'medium',
      location: { latitude: -22.904, longitude: -43.186, address: 'Praça Central — Vila Esperança' },
      images: [], reportedBy: 'demo-citizen', reportedAt: '2026-09-09T18:00:00.000Z',
      votes: 3, comments: [], statusHistory: [
        { status: 'pending', at: '2026-09-09T18:00:00.000Z', justification: 'Relato recebido.' },
        { status: 'in_progress', at: '2026-09-10T12:00:00.000Z', justification: 'Equipe designada.' },
      ],
    },
    {
      id: 'demo-003', title: 'Entulho recolhido na avenida',
      description: 'Entulho junto à calçada; remoção concluída.',
      category: 'cleaning', status: 'resolved', priority: 'low',
      location: { latitude: -22.902, longitude: -43.184, address: 'Avenida das Flores, 45 — Vila Esperança' },
      images: [], reportedBy: 'demo-neighbor', reportedAt: '2026-09-07T10:00:00.000Z',
      resolvedAt: '2026-09-08T15:00:00.000Z', votes: 2, comments: [], statusHistory: [
        { status: 'pending', at: '2026-09-07T10:00:00.000Z', justification: 'Relato recebido.' },
        { status: 'resolved', at: '2026-09-08T15:00:00.000Z', justification: 'Material recolhido.' },
      ],
    },
  ] as DemoProblem[])) as DemoProblem[];
}
