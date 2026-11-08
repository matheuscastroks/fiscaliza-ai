export interface BreakdownShare {
  /** Percentual real, sem arredondamento, limitado a 100. */
  share: number;
  /** Rótulo arredondado; usa "<1" quando há registros mas a fração é menor que 1%. */
  label: string;
  /** Largura da barra: preserva um mínimo visível apenas quando há registros. */
  barWidth: number;
}

export function breakdownShare(count: number, base: number): BreakdownShare {
  if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(base) || base <= 0) {
    return { share: 0, label: '0', barWidth: 0 };
  }
  const share = Math.min(100, (count / base) * 100);
  const rounded = Math.round(share);
  return {
    share,
    label: rounded === 0 ? '<1' : String(rounded),
    barWidth: Math.max(2, share),
  };
}
