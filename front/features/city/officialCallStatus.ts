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
