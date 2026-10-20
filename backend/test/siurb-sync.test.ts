import test from 'node:test';
import assert from 'node:assert/strict';
import { database } from '../src/db.js';
import { getSiurbLayer } from '../src/integrations/siurb/catalog.js';
import { siurbFixture, schoolFeature } from './siurb-fixture.js';
import { readFile } from 'node:fs/promises';

test('SIURB retains unnamed official spaces as absent cadastral information', async () => {
  const path = '../src/integrations/siurb/mapper.js';
  const { mapSiurbFeature } = await import(path);
  const original = JSON.parse(
    await readFile('test/fixtures/siurb/sample-16-unnamed.json', 'utf8'),
  );
  const result = mapSiurbFeature(getSiurbLayer(16), original);
  assert.equal(result.kind, 'valid');
  assert.equal(result.value.name, null);
  assert.deepEqual(result.value.originalData, original);
});

test('SIURB maps recorded official samples from every category without changing original information', async () => {
  const path = '../src/integrations/siurb/mapper.js';
  const { mapSiurbFeature } = await import(path);
  for (const id of [1, 2, 16, 18] as const) {
    const original = JSON.parse(
      await readFile(`test/fixtures/siurb/sample-${id}.json`, 'utf8'),
    );
    const mapped = mapSiurbFeature(getSiurbLayer(id), original);
    assert.equal(mapped.kind, 'valid', `layer ${id}: ${mapped.reason}`);
    assert.deepEqual(mapped.value.originalData, original);
  }
});

test('SIURB geometry excludes holes and boundaries and rejects invalid coordinates', async () => {
  const path = '../src/integrations/siurb/geometry.js';
  const { geometryState, parseTerritorialGeometry, interiorPoint } =
    await import(path);
  const shape = {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
      [
        [4, 4],
        [6, 4],
        [6, 6],
        [4, 6],
        [4, 4],
      ],
    ],
  };
  assert.equal(geometryState(shape, 5, 5), 'outside');
  assert.equal(geometryState(shape, 0, 5), 'boundary');
  assert.equal(geometryState(shape, 2, 2), 'inside');
  const point = interiorPoint(shape);
  assert.equal(geometryState(shape, point.latitude, point.longitude), 'inside');
  assert.throws(
    () =>
      parseTerritorialGeometry({ type: 'Point', coordinates: [1000, 2000] }),
    /geometr/i,
  );
  assert.throws(
    () =>
      parseTerritorialGeometry({
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 1],
            [2, 2],
            [0, 0],
          ],
        ],
      }),
    /geometr/i,
  );
});

test('SIURB mapper preserves original attributes and leaves conflicting or boundary neighborhood links unresolved', async () => {
  const path = '../src/integrations/siurb/mapper.js';
  const { mapSiurbFeature, resolveFacilityNeighborhood } = await import(path);
  const original = schoolFeature(1);
  const mapped = mapSiurbFeature(getSiurbLayer(1), original);
  assert.equal(mapped.kind, 'valid');
  assert.deepEqual(mapped.value.originalData, original);
  const boundaries = [
    {
      id: 'rio-neighborhood:005',
      externalId: '005',
      name: 'Centro',
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
    },
  ];
  assert.equal(
    resolveFacilityNeighborhood(mapped, boundaries)?.id,
    'rio-neighborhood:005',
  );
  assert.equal(
    resolveFacilityNeighborhood({ ...mapped, reportedCode: '006' }, boundaries),
    null,
  );
  assert.equal(
    resolveFacilityNeighborhood(
      { ...mapped, value: { ...mapped.value, longitude: -43.21 } },
      boundaries,
    ),
    null,
  );
  assert.equal(
    resolveFacilityNeighborhood(
      {
        ...mapped,
        reportedName: null,
        value: { ...mapped.value, latitude: null, longitude: null },
      },
      boundaries,
      new Map([['005', 'rio-neighborhood:005']]),
    )?.id,
    'rio-neighborhood:005',
  );
  const malformed = {
    ...original,
    properties: {
      ...original.properties,
      globalid: '00000000-0000-{0000}-0000-000000000001',
    },
  };
  assert.equal(mapSiurbFeature(getSiurbLayer(1), malformed).kind, 'rejected');
});

test(
  'SIURB publishes complete snapshots only, withdraws missing items and preserves the last good version on failures',
  { skip: !process.env.DATABASE_URL },
  async () => {
    const path = '../src/integrations/siurb/sync.js';
    const { syncSiurbLayer } = await import(path);
    const { db, pool } = database();
    const fixture = await siurbFixture();
    try {
      await syncSiurbLayer(pool, db, 18, fixture.fetcher);
      const first = await syncSiurbLayer(pool, db, 1, fixture.fetcher);
      assert.equal(first.coverage, 'complete');
      const read = async () =>
        (
          await pool.query(
            "SELECT f.id,f.neighborhood_id,f.original_data FROM public_facilities f JOIN data_sources s ON s.id=f.source_id AND s.published_run_id=f.last_seen_run_id WHERE f.source_id='siurb-schools' ORDER BY f.id",
          )
        ).rows;
      assert.equal((await read()).length, 2);
      assert.equal((await read())[0].neighborhood_id, 'rio-neighborhood:005');
      const repeated = await syncSiurbLayer(pool, db, 1, fixture.fetcher);
      assert.equal(repeated.counters.imported, 0);
      assert.equal(repeated.counters.updated, 2);
      assert.equal((await read()).length, 2);
      fixture.state.rows = [schoolFeature(1)];
      await syncSiurbLayer(pool, db, 1, fixture.fetcher);
      const before = await read();
      assert.equal(before.length, 1);
      for (const fault of ['error', 'duplicate', 'missing', 'last-batch']) {
        fixture.state.fault = fault;
        fixture.state.rows =
          fault === 'last-batch'
            ? Array.from({ length: 501 }, (_, i) => schoolFeature(i + 1))
            : [schoolFeature(1), schoolFeature(2)];
        await assert.rejects(syncSiurbLayer(pool, db, 1, fixture.fetcher));
        assert.deepEqual(await read(), before, fault);
        if (fault === 'last-batch') {
          const [run] = (
            await pool.query(
              "SELECT received_count FROM source_sync_runs WHERE source_id='siurb-schools' ORDER BY started_at DESC LIMIT 1",
            )
          ).rows;
          assert.equal(run.received_count, 500);
        }
      }
      fixture.state.fault = '';
      fixture.state.rows = [];
      await assert.rejects(
        syncSiurbLayer(pool, db, 1, fixture.fetcher),
        /vazi|zero/i,
      );
      assert.deepEqual(await read(), before);
      fixture.state.rows = [
        {
          ...schoolFeature(1),
          geometry: { type: 'Point', coordinates: [1000, 1000] },
        },
      ];
      await assert.rejects(
        syncSiurbLayer(pool, db, 1, fixture.fetcher),
        /geometr|inválid/i,
      );
      assert.deepEqual(await read(), before);
    } finally {
      await fixture.close();
      await pool.end();
    }
  },
);

test(
  'SIURB client aborts an unresponsive HTTP source',
  { timeout: 20000 },
  async () => {
    const path = '../src/integrations/siurb/client.js';
    const { readLayerSnapshot } = await import(path);
    const fixture = await siurbFixture();
    try {
      fixture.state.fault = 'timeout';
      await assert.rejects(
        readLayerSnapshot(getSiurbLayer(1), fixture.fetcher),
        /timeout|abort/i,
      );
    } finally {
      await fixture.close();
    }
  },
);
