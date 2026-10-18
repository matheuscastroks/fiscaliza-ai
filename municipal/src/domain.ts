import type {
  Municipality,
  Occurrence,
  SessionUser,
  Status,
} from '../../shared/contracts.ts';

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
