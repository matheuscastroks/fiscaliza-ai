import test from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';
import { syncSiurbLayer } from '../src/integrations/siurb/sync.js';
import {
  siurbFixture,
  schoolFeature,
  neighborhoodFeature,
} from './siurb-fixture.js';

test(
  'public territorial API distinguishes unavailable sources, validates filters and keeps list/detail provenance safe',
  { skip: !process.env.DATABASE_URL },
  async () => {
    const { db, pool } = database();
    const fixture = await siurbFixture();
    const app = await buildApp();
    try {
      fixture.state.boundaries.push({
        ...neighborhoodFeature,
        properties: {
          objectid: 2,
          codbairro: '006',
          codbnum: 6,
          nome: 'Catumbi',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-43.27, -22.94],
              [-43.22, -22.94],
              [-43.22, -22.88],
              [-43.27, -22.88],
              [-43.27, -22.94],
            ],
          ],
        },
      });
      await syncSiurbLayer(pool, db, 18, fixture.fetcher);
      await syncSiurbLayer(pool, db, 1, fixture.fetcher);
      const list = await app.inject({
        url: '/api/public-facilities?categories=school&limit=1',
      });
      assert.equal(list.statusCode, 200, list.body);
      const first = list.json().data;
      assert.equal(first.total, 2);
      assert.equal(first.items.length, 1);
      assert.equal(first.hasMore, true);
      assert.equal('geometry' in first.items[0], false);
      assert.equal('originalData' in first.items[0], false);
      const next = (
        await app.inject({
          url: '/api/public-facilities?categories=school&limit=1&page=2',
        })
      ).json().data;
      assert.notEqual(first.items[0].id, next.items[0].id);
      assert.equal(next.hasMore, false);
      const details = await app.inject({
        url: '/api/public-facilities/' + encodeURIComponent(first.items[0].id),
      });
      assert.equal(details.statusCode, 200);
      assert.equal(details.json().data.geometry.type, 'Point');
      assert.equal(details.json().data.provenance.referenceDate, null);
      const empty = (
        await app.inject({
          url: '/api/public-facilities?categories=school&neighborhoodId=rio-neighborhood%3A006',
        })
      ).json().data;
      assert.equal(empty.total, 0);
      assert.deepEqual(empty.items, []);
      await pool.query(
        "UPDATE data_sources SET published_run_id=NULL,published_at=NULL,state='unavailable' WHERE id='siurb-health'",
      );
      const unavailable = (
        await app.inject({ url: '/api/public-facilities?categories=health' })
      ).json().data;
      assert.equal(unavailable.total, null);
      assert.equal(unavailable.sources[0].state, 'unavailable');
      for (const query of [
        'north=1',
        'north=10&south=20&east=5&west=1',
        'limit=501',
        'categories=private',
        'page=0',
      ])
        assert.equal(
          (await app.inject({ url: '/api/public-facilities?' + query }))
            .statusCode,
          400,
          query,
        );
      const boundaries = (
        await app.inject({ url: '/api/territorial-boundaries' })
      ).json().data;
      assert.equal(boundaries.length, 2);
      assert.equal('geometry' in boundaries[0], false);
      const boundary = await app.inject({
        url: '/api/territorial-boundaries/rio-neighborhood%3A005',
      });
      assert.equal(boundary.statusCode, 200);
      assert.equal(boundary.json().data.geometry.type, 'Polygon');
      await pool.query(
        "UPDATE data_sources SET usage='aggregate' WHERE id='siurb-schools'",
      );
      assert.equal(
        (
          await app.inject({
            url:
              '/api/public-facilities/' + encodeURIComponent(first.items[0].id),
          })
        ).statusCode,
        404,
      );
      await pool.query(
        "UPDATE data_sources SET usage='individual' WHERE id='siurb-schools'",
      );
      fixture.state.rows = [
        {
          ...schoolFeature(3),
          properties: { ...schoolFeature(3).properties, nome_escola: null },
        },
      ];
      await syncSiurbLayer(pool, db, 1, fixture.fetcher);
      assert.equal(
        (
          await app.inject({ url: '/api/public-facilities?categories=school' })
        ).json().data.items[0].name,
        null,
      );
      const sources = await app.inject({ url: '/api/data-sources' });
      assert.equal(sources.statusCode, 200);
      assert.equal(sources.body.includes('originalData'), false);
      assert.equal(sources.body.includes('private upstream'), false);
      assert.equal(sources.body.includes('details'), false);
    } finally {
      await pool.query(
        "UPDATE data_sources SET usage='individual' WHERE id='siurb-schools'",
      );
      await app.close();
      await fixture.close();
      await pool.end();
    }
  },
);

test(
  'neighborhood overview and 1746 list use the same confirmed identity and inclusive date window',
  { skip: !process.env.DATABASE_URL },
  async () => {
    const { db, pool } = database();
    const fixture = await siurbFixture();
    const app = await buildApp();
    try {
      await syncSiurbLayer(pool, db, 18, fixture.fetcher);
      await syncSiurbLayer(pool, db, 1, fixture.fetcher);
      await pool.query(
        "INSERT INTO official_calls(id,external_id,service_type,service_subtype,opened_at,neighborhood_id,neighborhood_name) VALUES ('public-call-scope','public-call-scope','Iluminação','Reparo','2026-09-20T18:00:00Z','5','Centro'),('public-call-wrong','public-call-wrong','Iluminação','Reparo','2026-09-20T18:00:00Z','6','Centro') ON CONFLICT DO NOTHING",
      );
      await pool.query(
        "INSERT INTO source_sync_runs(id,source_id,status,coverage,requested_start,requested_end) VALUES ('public-call-partial','rio1746','partial','partial','2026-09-20','2026-09-20')",
      );
      const suffix = '?startDate=2026-09-20&endDate=2026-09-20';
      const response = await app.inject({
        url: '/api/neighborhoods/rio-neighborhood%3A005/overview' + suffix,
      });
      assert.equal(response.statusCode, 200, response.body);
      const data = response.json().data;
      assert.equal(data.facilityCounts.school, 2);
      assert.equal(data.calls.total, 1);
      assert.equal(data.calls.coverage, 'partial');
      assert.equal(data.calls.requestedEnd, '2026-09-20');
      const list = (
        await app.inject({
          url:
            '/api/rio1746/calls' +
            suffix +
            '&neighborhoodId=rio-neighborhood%3A005',
        })
      ).json().data;
      assert.equal(list.total, data.calls.total);
      assert.equal(list.calls[0].id, 'public-call-scope');
      const mixed = await app.inject({
        url: '/api/rio1746/calls?neighborhoodId=rio-neighborhood%3A005&startDate=2026-09-20T12%3A00%3A00Z&endDate=2026-09-20',
      });
      assert.equal(mixed.statusCode, 200, mixed.body);
      assert.equal(mixed.json().data.total, 1);
      assert.equal(
        (
          await app.inject({
            url: '/api/rio1746/calls?startDate=2026-02-30T12%3A00%3A00Z',
          })
        ).statusCode,
        400,
      );
      assert.equal(
        (
          await app.inject({
            url: '/api/neighborhoods/rio-neighborhood%3A005/overview?startDate=2026-02-30&endDate=2026-03-01',
          })
        ).statusCode,
        400,
      );
      assert.equal(
        (
          await app.inject({
            url: '/api/neighborhoods/rio-neighborhood%3A999/overview' + suffix,
          })
        ).statusCode,
        404,
      );
    } finally {
      await pool.query(
        "DELETE FROM official_calls WHERE id IN ('public-call-scope','public-call-wrong')",
      );
      await pool.query(
        "DELETE FROM source_sync_runs WHERE id='public-call-partial'",
      );
      await app.close();
      await fixture.close();
      await pool.end();
    }
  },
);
