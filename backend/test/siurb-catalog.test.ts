import test from 'node:test';
import assert from 'node:assert/strict';

test('SIURB catalog only accepts fixed official layer IDs and preserves geometry kinds', async () => {
  const path = '../src/integrations/siurb/catalog.js';
  const { getSiurbLayer } = await import(path);
  assert.throws(() => getSiurbLayer('https://example.com/private'), /camada/i);
  assert.equal(getSiurbLayer(2).oid, 'objectid_1');
  assert.equal(getSiurbLayer(16).geometryType, 'esriGeometryPolygon');
  assert.match(getSiurbLayer(1).url, /^https:\/\/pgeo3\.rio\.rj\.gov\.br\//);
});

test('SIURB probe keeps absent dates unknown and detects ArcGIS errors in HTTP 200', async () => {
  const path = '../src/integrations/siurb/probe.js';
  const { probeSiurbLayer } = await import(path);
  const fetcher: typeof fetch = async (input) => {
    const url = new URL(String(input));
    if (!url.pathname.endsWith('/query'))
      return Response.json({
        id: 2,
        geometryType: 'esriGeometryPoint',
        fields: [
          { name: 'objectid_1', type: 'esriFieldTypeOID' },
          { name: 'nome' },
        ],
        advancedQueryCapabilities: { supportsPagination: true },
        supportedQueryFormats: 'JSON, geoJSON',
      });
    if (url.searchParams.has('returnCountOnly'))
      return Response.json({ count: 1 });
    if (url.searchParams.has('returnIdsOnly'))
      return Response.json({ objectIdFieldName: 'objectid_1', objectIds: [7] });
    assert.equal(url.searchParams.get('resultRecordCount'), '5');
    assert.equal(url.searchParams.get('outSR'), '4326');
    return Response.json({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { objectid_1: 7, nome: 'Unidade' },
          geometry: { type: 'Point', coordinates: [-43.2, -22.9] },
        },
      ],
    });
  };
  const result = await probeSiurbLayer(2, fetcher);
  assert.equal(result.sourceUpdatedAt, null);
  assert.equal(result.referenceDate, null);
  assert.equal(result.count, 1);
  assert.equal(result.idsCount, 1);
  await assert.rejects(
    probeSiurbLayer(2, async () =>
      Response.json({
        error: { code: 498, message: 'Internal upstream details' },
      }),
    ),
    /ArcGIS/,
  );
});
