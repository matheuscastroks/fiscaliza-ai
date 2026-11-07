import type { OfficialCall } from '@/shared/contracts';
import type { ThemeColors } from '@/theme/colors';

/** Preserve the published outcome: administrative closure is not proof of resolution. */
export function officialCallStatus(
  call: OfficialCall,
  colors: ThemeColors,
  isDark: boolean,
) {
  const label =
    call.officialStatus || call.officialSituation || 'Situação não informada';
  const key = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const color =
    key === 'aberto'
      ? isDark
        ? '#93C5FD'
        : '#1D4ED8'
      : key === 'em andamento'
        ? isDark
          ? '#67E8F9'
          : '#0E7490'
        : key === 'pendente'
          ? colors.attention
          : key === 'fechado com solucao'
            ? colors.completed
            : ['cancelado', 'sem possibilidade de atendimento'].includes(key)
              ? colors.risk
              : colors.muted;
  return { label, color };
}

/**
 * Evaluates deadline compliance coherently against `targetDate` and `closedAt`
 * so open calls whose `targetDate` has already passed never display a stale
 * "A vencer (no prazo)" string from an older BigQuery snapshot.
 */
export function resolveOfficialCallDeadline(
  call: OfficialCall,
  isClosed: boolean,
  now = new Date(),
): { label: string; isOverdue: boolean } | null {
  const targetMs = call.targetDate ? new Date(call.targetDate).getTime() : NaN;
  const closedMs = call.closedAt ? new Date(call.closedAt).getTime() : NaN;
  const raw = call.withinDeadline?.trim() || '';
  const rawLower = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (Number.isFinite(targetMs)) {
    if (isClosed) {
      if (Number.isFinite(closedMs)) {
        return closedMs <= targetMs
          ? { label: 'Encerrado no prazo estimado', isOverdue: false }
          : { label: 'Encerrado fora do prazo estimado', isOverdue: true };
      }
      if (rawLower.includes('fora do prazo')) {
        return { label: 'Encerrado fora do prazo', isOverdue: true };
      }
      if (rawLower.includes('no prazo')) {
        return { label: 'Encerrado no prazo', isOverdue: false };
      }
    } else {
      if (now.getTime() > targetMs) {
        return { label: 'Prazo estimado vencido', isOverdue: true };
      }
      return { label: 'Dentro do prazo (a vencer)', isOverdue: false };
    }
  }

  if (!raw) return null;
  return {
    label: raw,
    isOverdue: rawLower.includes('fora do prazo') || rawLower.includes('vencido'),
  };
}
