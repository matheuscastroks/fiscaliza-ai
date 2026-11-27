// O toque num agrupamento do mapa depende de quantos chamados ele reúne:
// poucos viram cartões lado a lado, uma quantidade média abre a lista e
// grupos grandes aproximam o mapa, que é o que a pessoa costuma querer.

export const CLUSTER_CAROUSEL_MAX = 20;
export const CLUSTER_LIST_MAX = 30;
export const CLUSTER_ZOOM_STEP = 2;
/** Acima deste zoom os pontos quase coincidem: aproximar mais não separa o grupo. */
export const CLUSTER_MAX_ZOOM = 17;

export type ClusterAction = 'carousel' | 'list' | 'zoom';

export function clusterAction(count: number, zoom: number | undefined): ClusterAction {
  if (count <= CLUSTER_CAROUSEL_MAX) return 'carousel';
  if (count <= CLUSTER_LIST_MAX) return 'list';
  return (zoom ?? 0) >= CLUSTER_MAX_ZOOM ? 'list' : 'zoom';
}

export function clusterZoomTarget(zoom: number | undefined) {
  return Math.min(CLUSTER_MAX_ZOOM + 1, Math.max(12, (zoom ?? 11) + CLUSTER_ZOOM_STEP));
}
