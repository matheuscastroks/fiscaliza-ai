import type { CivicTerritory, CivicItem } from '../../shared/contracts.js';
export interface CivicUpdate {
  status?: string;
  decision?: string;
  result?: string;
  responsible?: string;
  progress?: number;
  evidence?: string[];
  update?: string;
  dueAt?: string;
  justification?: string;
  territory?: CivicTerritory;
}
const invalid = (message: string) =>
  Object.assign(new Error(message), { statusCode: 400 });
// Keep legacy sentinel interpretation aligned with shared/civic-territory.ts.
// This backend package emits ESM, while Expo's shared runtime emits CommonJS.
export function normalizeNeighborhood(value: string): string {
  return value.trim().replace(/\s+/g, ' ').normalize('NFD')
    .replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
}
export function effectiveTerritory(value: CivicItem): CivicTerritory {
  if (value.territory) return value.territory;
  const label = normalizeNeighborhood(value.neighborhood || '');
  return !label || ['todo o municipio', 'municipio', 'todos os bairros'].includes(label)
    ? { scope: 'municipality' }
    : { scope: 'neighborhood', neighborhood: value.neighborhood };
}
function territoryKey(value: CivicTerritory): string {
  if (value.scope === 'municipality') return 'municipality';
  const neighborhood = normalizeNeighborhood(value.neighborhood);
  if (value.scope === 'neighborhood') return JSON.stringify([value.scope, neighborhood]);
  return JSON.stringify([value.scope, neighborhood, value.location.latitude,
    value.location.longitude, normalizeNeighborhood(value.location.address || '')]);
}
/** Called under the record row lock; every decision remains attributable. */
export function applyCivicUpdate(
  value: CivicItem,
  b: CivicUpdate,
  actor: string,
) {
  const from = value.status;
  const changing =
    (b.territory !== undefined && territoryKey(b.territory) !== territoryKey(effectiveTerritory(value))) ||
    (b.status !== undefined && b.status !== from) ||
    (b.responsible !== undefined && b.responsible !== value.responsible) ||
    (value.kind === 'action' &&
      ((b.progress !== undefined && b.progress !== value.progress) ||
        (b.dueAt !== undefined && b.dueAt !== value.dueAt) ||
        Boolean(b.evidence?.length)));
  const explanation = (
    b.justification ||
    b.decision ||
    b.result ||
    b.update ||
    ''
  ).trim();
  if (changing && !explanation)
    throw invalid('Informe uma justificativa pública para a alteração.');
  const transitions: Record<string, string[]> =
    value.kind === 'proposal'
      ? {
          submitted: ['under_review', 'accepted', 'declined'],
          under_review: ['accepted', 'declined'],
          accepted: [],
          declined: [],
        }
      : value.kind === 'consultation'
        ? { open: ['closed'], closed: [] }
        : {
            planned: ['in_progress'],
            in_progress: ['completed'],
            completed: [],
          };
  if (b.status && b.status !== from && !transitions[from]?.includes(b.status))
    throw invalid('Transição de situação inválida.');
  if (value.kind === 'proposal') {
    if (b.status === 'accepted' || b.status === 'declined') {
      if (!b.decision?.trim())
        throw invalid('A decisão exige uma justificativa.');
    }
    if (b.status) value.status = b.status as typeof value.status;
    if (b.decision) value.decision = b.decision;
  } else if (value.kind === 'consultation') {
    if (b.status === 'closed' && !b.result?.trim())
      throw invalid('Publique o resultado para encerrar.');
    if (b.status) value.status = b.status as typeof value.status;
    if (b.result) value.result = b.result;
  } else {
    if (b.status) value.status = b.status as typeof value.status;
    if (b.progress !== undefined) value.progress = b.progress;
    if (value.status === 'completed') value.progress = 100;
    if (b.evidence) value.evidence.push(...b.evidence);
    if (b.update)
      value.updates.push({
        at: new Date().toISOString(),
        text: b.update,
        actor,
      });
    if (b.dueAt) value.dueAt = b.dueAt;
  }
  if (b.responsible) value.responsible = b.responsible;
  if (b.territory) {
    value.territory = b.territory;
    value.neighborhood = b.territory.scope === 'municipality'
      ? 'Todo o município' : b.territory.neighborhood;
  }
  if (explanation) {
    value.history ??= [];
    value.history.push({
      at: new Date().toISOString(),
      actor,
      from,
      to: value.status,
      text: explanation,
    });
  }
  return value;
}
