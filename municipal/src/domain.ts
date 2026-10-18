import type {
  Municipality,
  CivicBase,
  CivicTerritory,
  Occurrence,
  SessionUser,
  Status,
} from '../../shared/contracts.ts';
import { civicTerritory } from '../../shared/civic-territory.ts';

export interface CivicTerritoryDraft {
  scope: CivicTerritory['scope'];
  neighborhood: string;
  latitude: string;
  longitude: string;
  address: string;
}

export function civicTerritoryDraft(
  item?: Pick<CivicBase, 'neighborhood' | 'territory'>,
): CivicTerritoryDraft {
  const territory = item ? civicTerritory(item) : { scope: 'municipality' as const };
  return {
    scope: territory.scope,
    neighborhood: territory.scope === 'municipality' ? '' : territory.neighborhood,
    latitude: territory.scope === 'location' ? String(territory.location.latitude) : '',
    longitude: territory.scope === 'location' ? String(territory.location.longitude) : '',
    address: territory.scope === 'location' ? territory.location.address || '' : '',
  };
}

export function serializeCivicTerritory(
  draft: CivicTerritoryDraft,
): { neighborhood: string; territory: CivicTerritory } {
  if (draft.scope === 'municipality')
    return { neighborhood: 'Todo o município', territory: { scope: 'municipality' } };
  const neighborhood = draft.neighborhood.trim();
  if (!neighborhood) throw new Error('Informe o bairro da abrangência.');
  if (draft.scope === 'neighborhood')
    return { neighborhood, territory: { scope: 'neighborhood', neighborhood } };
  const latitude = Number(draft.latitude),
    longitude = Number(draft.longitude);
  if (
    !draft.latitude.trim() || !Number.isFinite(latitude) ||
    latitude < -90 || latitude > 90
  )
    throw new Error('Informe uma latitude válida, entre -90 e 90.');
  if (
    !draft.longitude.trim() || !Number.isFinite(longitude) ||
    longitude < -180 || longitude > 180
  )
    throw new Error('Informe uma longitude válida, entre -180 e 180.');
  return {
    neighborhood,
    territory: {
      scope: 'location', neighborhood,
      location: {
        latitude, longitude,
        ...(draft.address.trim() ? { address: draft.address.trim() } : {}),
      },
    },
  };
}

export function civicTerritoryLabel(
  item: Pick<CivicBase, 'neighborhood' | 'territory'>,
): string {
  const territory = civicTerritory(item);
  return territory.scope === 'municipality'
    ? 'Todo o município'
    : territory.scope === 'location'
      ? `Local específico · ${territory.neighborhood}`
      : `Bairro · ${territory.neighborhood}`;
}

export function hasMunicipalAccess(
  user: SessionUser | null,
): user is SessionUser & { municipality: Municipality } {
  return (
    !!user &&
    (user.role === 'staff' || user.role === 'admin') &&
    !!user.municipality
  );
}
export const labels: Record<string, string> = {
  pending: 'Recebida',
  in_progress: 'Em andamento',
  resolved: 'Concluída',
  submitted: 'Recebida',
  under_review: 'Em análise',
  accepted: 'Aprovada',
  declined: 'Não aprovada',
  open: 'Aberta',
  closed: 'Encerrada',
  planned: 'Planejada',
  completed: 'Concluída',
  road: 'Vias públicas',
  lighting: 'Iluminação',
  cleaning: 'Limpeza',
  others: 'Outros',
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};
export const nextStatuses: Record<Status, Status[]> = {
  pending: ['in_progress'],
  in_progress: ['pending', 'resolved'],
  resolved: ['in_progress'],
};
export function transitionError(
  current: Status,
  next: Status,
  justification: string,
  sector: string,
  assignmentChanged = false,
) {
  if (
    !nextStatuses[current].includes(next) &&
    !(current === next && assignmentChanged)
  )
    return 'Altere a situação, o setor ou a prioridade técnica.';
  if (!justification.trim()) return 'Informe a justificativa para o cidadão.';
  if (!sector.trim()) return 'Informe o setor responsável.';
  return '';
}
export function filterOccurrences(
  items: Occurrence[],
  query: string,
  status: string,
  category: string,
  neighborhood: string,
) {
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR');
  return items.filter(
    (i) =>
      (!status || i.status === status) &&
      (!category || i.category === category) &&
      (!neighborhood || i.location.neighborhood === neighborhood) &&
      normalize(
        `${i.title} ${i.description} ${i.location.address} ${i.id}`,
      ).includes(normalize(query)),
  );
}
export const date = (value: string) =>
  new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
export const isoDate = (value: string) =>
  value ? new Date(value).toISOString() : undefined;
