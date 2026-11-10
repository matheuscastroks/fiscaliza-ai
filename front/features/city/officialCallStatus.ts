import type { OfficialCall } from '@/shared/contracts';
import type { ThemeColors } from '@/theme/colors';
import { deadlineInstant } from './formatDates';

/** Preserve the published outcome: administrative closure is not proof of resolution. */
export function officialCallStatus(
  call: OfficialCall,
  colors: ThemeColors,
  _isDark?: boolean,
) {
  const label =
    call.officialStatus || call.officialSituation || 'Situação não informada';
  const key = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const color = officialStatusColor(label, colors);
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
  const targetMs = deadlineInstant(call.targetDate);
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

/** Cor semântica de uma situação publicada (texto do servidor). A cor acompanha o texto, nunca o substitui. */
export function officialStatusColor(label: string, colors: ThemeColors): string {
  const key = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (key === 'aberto') return colors.info;
  if (key === 'em andamento') return colors.primary;
  if (key === 'pendente') return colors.attention;
  if (
    key === 'fechado com solucao' ||
    ['atendido', 'procedente', 'concluido', 'executado'].some((word) => key.includes(word))
  )
    return colors.completed;
  if (
    ['cancelado', 'improcedente', 'sem possibilidade', 'indeferido'].some((word) => key.includes(word))
  )
    return colors.risk;
  if (['vistoriado', 'em analise', 'orientado', 'encaminhado'].some((word) => key.includes(word)))
    return colors.primary;
  return colors.muted;
}
