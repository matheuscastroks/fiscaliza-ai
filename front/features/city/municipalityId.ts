/** Fallback somente para visitantes sem município na sessão (Rio de Janeiro, código IBGE). */
export const DEFAULT_MUNICIPALITY_ID = '3304557';

export function resolveMunicipalityId(municipalityId?: string | null): string {
  return municipalityId || DEFAULT_MUNICIPALITY_ID;
}
