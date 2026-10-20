import test from 'node:test';
import assert from 'node:assert/strict';
import { database } from '../src/db.js';
import { applyMigrations } from '../src/migrations.js';

test(
  'territorial migrations preserve existing calls, records and accounts and can run twice',
  { skip: !process.env.DATABASE_URL },
  async () => {
    const { pool } = database();
    const counts = async () =>
      (
        await pool.query(
          'SELECT (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM records) AS records, (SELECT count(*) FROM official_calls) AS calls',
        )
      ).rows;
    try {
      const before = await counts();
      await applyMigrations(pool);
      await applyMigrations(pool);
      assert.deepEqual(await counts(), before);
      const tables = await pool.query(
        "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('data_sources','public_facilities','territorial_boundaries','territorial_boundary_aliases')",
      );
      assert.equal(tables.rowCount, 4);
    } finally {
      await pool.end();
    }
  },
);

test(
  'territorial sources default to unknown usage and unresolved facility links stay null',
  { skip: !process.env.DATABASE_URL },
  async () => {
    const { pool } = database();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        "INSERT INTO data_sources(id,name,provider,official_url) VALUES ('schema-fixture','Cadastro','IPP','https://example.invalid')",
      );
      const [source] = (
        await client.query(
          "SELECT usage,state,published_at FROM data_sources WHERE id='schema-fixture'",
        )
      ).rows;
      assert.deepEqual(source, {
        usage: 'unknown',
        state: 'unavailable',
        published_at: null,
      });
      await client.query(
        "INSERT INTO public_facilities(id,source_id,external_id,category,name) VALUES ('schema-fixture-1','schema-fixture','1','school','Escola')",
      );
      const [facility] = (
        await client.query(
          "SELECT neighborhood_id,geometry,latitude,longitude FROM public_facilities WHERE id='schema-fixture-1'",
        )
      ).rows;
      assert.deepEqual(facility, {
        neighborhood_id: null,
        geometry: null,
        latitude: null,
        longitude: null,
      });
      await assert.rejects(
        client.query(
          "INSERT INTO public_facilities(id,source_id,external_id,category,name) VALUES ('schema-fixture-2','schema-fixture','1','health','Unidade')",
        ),
        { code: '23505' },
      );
    } finally {
      await client.query('ROLLBACK');
      client.release();
      await pool.end();
    }
  },
);
