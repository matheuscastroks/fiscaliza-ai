import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getSiurbLayer,
  SIURB_LAYER_IDS,
  type SiurbLayerId,
} from './catalog.js';

export interface LayerProbe {
  layerId: SiurbLayerId;
  url: string;
  checkedAt: string;
  count: number;
  idsCount: number;
  oid: string;
  fields: Record<string, unknown>[];
  supportsPagination: boolean;
  supportedQueryFormats: string;
  sourceUpdatedAt: string | null;
  referenceDate: string | null;
  copyright: string | null;
  sample: Record<string, unknown>;
}

export async function readSiurbJson(
  url: URL,
  fetcher: typeof fetch,
): Promise<Record<string, unknown>> {
  const response = await fetcher(url, {
    signal: AbortSignal.timeout(15000),
    headers: { accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`ArcGIS HTTP ${response.status}.`);
  if (!response.body) throw new Error('ArcGIS retornou corpo vazio.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 8388608) throw new Error('ArcGIS: resposta acima de 8 MB.');
      chunks.push(chunk.value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }
  const result: unknown = JSON.parse(
    new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)),
  );
  if (
    !result ||
    typeof result !== 'object' ||
    Array.isArray(result) ||
    'error' in result
  )
    throw new Error('ArcGIS retornou resposta inválida ou erro.');
  return result as Record<string, unknown>;
}

export async function probeSiurbLayer(
  layerId: SiurbLayerId,
  fetcher: typeof fetch = fetch,
): Promise<LayerProbe> {
  const layer = getSiurbLayer(layerId);
  const metadataUrl = new URL(layer.url);
  metadataUrl.searchParams.set('f', 'json');
  const metadata = await readSiurbJson(metadataUrl, fetcher);
  const fields = Array.isArray(metadata.fields)
    ? (metadata.fields as Record<string, unknown>[])
    : [];
  const oid = fields.find((field) => field.type === 'esriFieldTypeOID')?.name;
  if (
    oid !== layer.oid ||
    metadata.geometryType !== layer.geometryType ||
    !fields.some((field) => field.name === layer.nameField)
  )
    throw new Error('ArcGIS: contrato cadastral da camada mudou.');
  const selected = layer.fields.filter((name) =>
    fields.some((field) => field.name === name),
  );
  const query = (params: Record<string, string>) => {
    const url = new URL(`${layer.url}/query`);
    url.search = new URLSearchParams({
      f: 'json',
      where: '1=1',
      ...params,
    }).toString();
    return readSiurbJson(url, fetcher);
  };
  const counts = await query({ returnCountOnly: 'true' });
  if (
    !Number.isSafeInteger(counts.count) ||
    Number(counts.count) < 0 ||
    Number(counts.count) > 50000
  )
    throw new Error('ArcGIS: contagem fora do limite de validação.');
  const ids = await query({ returnIdsOnly: 'true', returnGeometry: 'false' });
  if (
    !Array.isArray(ids.objectIds) ||
    ids.objectIds.length !== counts.count ||
    new Set(ids.objectIds).size !== ids.objectIds.length
  )
    throw new Error('ArcGIS: enumeração incompleta de IDs.');
  const sample = await query({
    f: 'geojson',
    outFields: selected.join(','),
    outSR: '4326',
    resultRecordCount: '5',
    orderByFields: `${layer.oid} ASC`,
  });
  if (
    sample.type !== 'FeatureCollection' ||
    !Array.isArray(sample.features) ||
    sample.features.length > 5
  )
    throw new Error('ArcGIS: amostra GeoJSON inválida.');
  const editingInfo = metadata.editingInfo as
    | { lastEditDate?: unknown }
    | undefined;
  const updated =
    typeof editingInfo?.lastEditDate === 'number' &&
    Number.isFinite(editingInfo.lastEditDate)
      ? new Date(editingInfo.lastEditDate)
      : null;
  return {
    layerId,
    url: layer.url,
    checkedAt: new Date().toISOString(),
    count: Number(counts.count),
    idsCount: ids.objectIds.length,
    oid: layer.oid,
    fields,
    sample,
    supportsPagination:
      (
        metadata.advancedQueryCapabilities as
          | { supportsPagination?: boolean }
          | undefined
      )?.supportsPagination === true,
    supportedQueryFormats: String(metadata.supportedQueryFormats ?? ''),
    sourceUpdatedAt:
      updated && !isNaN(updated.getTime()) ? updated.toISOString() : null,
    referenceDate: null,
    copyright:
      typeof metadata.copyrightText === 'string' &&
      metadata.copyrightText.trim()
        ? metadata.copyrightText
        : null,
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  for (const id of SIURB_LAYER_IDS) {
    try {
      console.log(JSON.stringify(await probeSiurbLayer(id)));
    } catch (error) {
      console.error(
        `Camada ${id}: ${error instanceof Error ? error.message : 'Falha na validação.'}`,
      );
      process.exitCode = 1;
    }
  }
}
