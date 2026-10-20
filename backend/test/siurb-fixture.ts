import { createServer } from 'node:http';
import { getSiurbLayer } from '../src/integrations/siurb/catalog.js';

export const neighborhoodFeature = {
  type: 'Feature',
  properties: { objectid: 1, codbairro: '005', codbnum: 5, nome: 'Centro' },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-43.21, -22.94],
        [-43.15, -22.94],
        [-43.15, -22.88],
        [-43.21, -22.88],
        [-43.21, -22.94],
      ],
    ],
  },
};
export function schoolFeature(id: number) {
  return {
    type: 'Feature',
    properties: {
      objectid: id,
      globalid: `00000000-0000-0000-0000-${String(id).padStart(12, '0')}`,
      nome_escola: `Escola São João \u200b ${id}`,
      endereco: 'Rua Pública, 1',
      bairro: 'Centro',
      cod_bairro: '5',
      flg_ativa: 1,
    },
    geometry: { type: 'Point', coordinates: [-43.18, -22.91] },
  };
}
export async function siurbFixture() {
  const state = {
    rows: [schoolFeature(1), schoolFeature(2)] as unknown[],
    fault: '',
  };
  const server = createServer((req, res) => {
    const url = new URL(req.url!, 'http://localhost');
    const id = Number(
      url.pathname
        .split('/')
        .filter(Boolean)
        .find((part) => /^\d+$/.test(part)),
    ) as 1 | 2 | 16 | 18;
    const layer = getSiurbLayer(id);
    const rows = (id === 18 ? [neighborhoodFeature] : state.rows) as {
      properties: Record<string, unknown>;
    }[];
    const send = (value: unknown, status = 200) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(value));
    };
    if (state.fault === 'error')
      return send({ error: { code: 498, message: 'private upstream detail' } });
    if (state.fault === 'timeout') return;
    if (!url.pathname.endsWith('/query'))
      return send({
        id,
        geometryType: layer.geometryType,
        fields: layer.fields.map((name) => ({
          name,
          type: name === layer.oid ? 'esriFieldTypeOID' : 'esriFieldTypeString',
        })),
        advancedQueryCapabilities: { supportsPagination: true },
        supportedQueryFormats: 'JSON, geoJSON',
      });
    if (url.searchParams.has('returnCountOnly'))
      return send({ count: rows.length });
    if (url.searchParams.has('returnIdsOnly'))
      return send({
        objectIds:
          state.fault === 'duplicate'
            ? [1, 1]
            : rows.map((row) => row.properties[layer.oid]),
      });
    if (url.searchParams.has('objectIds')) {
      const ids = url.searchParams.get('objectIds')!.split(',').map(Number);
      if (state.fault === 'last-batch' && ids.length < 500)
        return send({ error: { code: 503 } }, 503);
      return send({
        type: 'FeatureCollection',
        features:
          state.fault === 'missing'
            ? []
            : rows.filter((row) =>
                ids.includes(Number(row.properties[layer.oid])),
              ),
      });
    }
    return send({ type: 'FeatureCollection', features: rows.slice(0, 5) });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  const fetcher: typeof fetch = (input, init) => {
    const url = new URL(String(input));
    return fetch(
      `http://127.0.0.1:${address.port}${url.pathname}${url.search}`,
      init,
    );
  };
  return {
    state,
    fetcher,
    close: async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
