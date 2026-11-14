const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Data sem horário ("2026-10-01") é dia civil local; com horário é um instante. */
export function isDateOnly(value?: string | null): boolean {
  return Boolean(value && DATE_ONLY.test(value.trim()));
}

export function parseCallDate(value?: string | null): Date | null {
  if (!value) return null;
  const text = value.trim();
  const match = DATE_ONLY.exec(text);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Instante em que o prazo termina: data sem horário vale até o fim do dia local. */
export function deadlineInstant(value?: string | null): number {
  const date = parseCallDate(value);
  if (!date) return NaN;
  if (isDateOnly(value)) date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export function formatCallDate(
  value?: string | null,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' },
): string | null {
  const date = parseCallDate(value);
  return date ? date.toLocaleDateString('pt-BR', options) : null;
}

/** Data com hora para instantes; só a data para valores sem horário (prazos). "—" quando falta. */
export function formatCallDateTime(value?: string | null): string {
  if (!value) return '—';
  const options: Intl.DateTimeFormatOptions = isDateOnly(value)
    ? { day: '2-digit', month: '2-digit', year: 'numeric' }
    : { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  const date = parseCallDate(value);
  return date ? date.toLocaleString('pt-BR', options) : value;
}

type Unit = 'day' | 'hour' | 'month' | null;
function unitOf(rawUnit?: string | null): Unit {
  const unit = (rawUnit || '').trim().toUpperCase();
  if (unit === 'D' || unit.startsWith('DIA')) return 'day';
  if (unit === 'H' || unit.startsWith('HORA')) return 'hour';
  // No Data.Rio "M" é mês, não minuto.
  if (unit === 'M' || unit.startsWith('MES') || unit.startsWith('MÊS')) return 'month';
  return null;
}

const LONG = { day: ['dia', 'dias'], hour: ['hora', 'horas'], month: ['mês', 'meses'] } as const;
const SHORT = { day: 'd', hour: 'h', month: ' m' } as const;

/** "3 meses", "1 dia"; sem unidade reconhecida usa a unidade original ou dias. */
export function formatTimeRemaining(amount?: number | null, rawUnit?: string | null): string | null {
  if (amount == null || amount <= 0) return null;
  const unit = unitOf(rawUnit);
  if (!unit) return `${amount} ${rawUnit?.trim() || 'dias'}`;
  return `${amount} ${LONG[unit][amount === 1 ? 0 : 1]}`;
}

/** Versão curta para linhas e cartões: "5d", "2h", "3 m". */
export function formatTimeRemainingShort(amount?: number | null, rawUnit?: string | null): string | null {
  if (amount == null || amount <= 0) return null;
  const unit = unitOf(rawUnit);
  return unit ? `${amount}${SHORT[unit]}` : formatTimeRemaining(amount, rawUnit);
}

/** "Hoje", "Ontem", "Há 3 dias": idade de um instante em relação a agora. */
export function formatRelativeAge(value?: string | null, now = new Date()): string | null {
  const date = parseCallDate(value);
  if (!date) return null;
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'Recente';
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 24) return hours <= 1 ? 'Hoje' : `Há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ontem';
  if (days < 30) return `Há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'Há 1 mês';
  if (months < 12) return `Há ${months} meses`;
  const years = Math.floor(days / 365);
  return `Há ${years} ${years === 1 ? 'ano' : 'anos'}`;
}
