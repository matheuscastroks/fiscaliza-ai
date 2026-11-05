import { getSiurbLayer, type SiurbLayerSpec } from './catalog.js';
import { probeSiurbLayer, readSiurbJson, type LayerProbe } from './probe.js';
export interface LayerSnapshot {
  probe: LayerProbe;
  ids: number[];
  features: unknown[];
}
export async function readLayerSnapshot(
  layer: SiurbLayerSpec,
  fetcher: typeof fetch = fetch,
): Promise<LayerSnapshot> {
  const progress = { received: 0 };
  try {
    return await readSnapshot(layer, fetcher, progress);
  } catch (error) {
    throw Object.assign(
      error instanceof Error ? error : new Error('ArcGIS: falha na leitura.'),
      { receivedCount: progress.received },
    );
  }
}
async function readSnapshot(
  layer: SiurbLayerSpec,
  fetcher: typeof fetch,
  progress: { received: number },
): Promise<LayerSnapshot> {
  if (getSiurbLayer(layer.id).url !== layer.url)
    throw new Error('Camada SIURB não permitida.');
  const deadline = AbortSignal.timeout(300000);
  const boundedFetch: typeof fetch = (input, init) =>
    fetcher(input, {
      ...init,
      signal: AbortSignal.any([deadline, init?.signal ?? deadline]),
    });
  const probe = await probeSiurbLayer(layer.id, boundedFetch);
  const query = (params: Record<string, string>) => {
    const url = new URL(`${layer.url}/query`);
    url.search = new URLSearchParams({
      where: '1=1',
      f: 'json',
      ...params,
    }).toString();
    return readSiurbJson(url, boundedFetch);
  };
  const readIds = async () => {
    const result = await query({
      returnIdsOnly: 'true',
      returnGeometry: 'false',
    });
    if (
      !Array.isArray(result.objectIds) ||
      result.objectIds.length > 50000 ||
      !result.objectIds.every((id) => Number.isSafeInteger(id) && id >= 0) ||
      new Set(result.objectIds).size !== result.objectIds.length
    )
      throw new Error('ArcGIS: IDs inválidos ou duplicados.');
    return (result.objectIds as number[]).sort((a, b) => a - b);
  };
  const ids = await readIds();
  if (ids.length !== probe.count)
    throw new Error('ArcGIS: contagem mudou durante a leitura.');
  const features: unknown[] = [];
  const seen = new Set<number>();
  const size =
    layer.category === 'boundary'
      ? 25
      : layer.category === 'square'
        ? 100
        : 500;
  let batches = 0;
  for (let start = 0; start < ids.length; start += size) {
    if (++batches > 100) throw new Error('ArcGIS: limite de lotes excedido.');
    const batch = ids.slice(start, start + size);
    const result = await query({
      f: 'geojson',
      objectIds: batch.join(','),
      outFields: layer.fields
        .filter((name) => probe.fields.some((f) => f.name === name))
        .join(','),
      outSR: '4326',
      returnGeometry: 'true',
    });
    if (Array.isArray(result.features))
      progress.received += result.features.length;
    if (
      result.type !== 'FeatureCollection' ||
      !Array.isArray(result.features) ||
      result.features.length !== batch.length ||
      result.exceededTransferLimit === true
    )
      throw new Error('ArcGIS: lote incompleto.');
    for (const feature of result.features) {
      const oid = (feature as { properties?: Record<string, unknown> })
        ?.properties?.[layer.oid];
      if (typeof oid !== 'number' || !batch.includes(oid) || seen.has(oid))
        throw new Error('ArcGIS: feature inesperada ou duplicada.');
      seen.add(oid);
      features.push(feature);
    }
  }
  const finalIds = await readIds();
  if (
    finalIds.length !== ids.length ||
    finalIds.some((id, i) => id !== ids[i]) ||
    features.length !== ids.length
  )
    throw new Error('ArcGIS: snapshot mudou ou está incompleto.');
  return { probe, ids, features };
}
