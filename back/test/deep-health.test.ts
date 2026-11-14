import assert from 'node:assert/strict';
import test from 'node:test';
import Fastify from 'fastify';
import { registerDeepHealthRoute } from '../src/deep-health.js';

test('deep health reports source ages without exposing internal errors', async () => {
  const app = Fastify();
  registerDeepHealthRoute(app, async () => [
    { sourceId: 'rio1746', finishedAt: new Date('2026-11-10T00:00:00Z') },
  ], () => new Date('2026-11-13T00:00:00Z'));
  const response = await app.inject('/api/health/deep');
  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.data.sources.find((s: { sourceId: string }) => s.sourceId === 'rio1746').ageSeconds, 259200);
  assert.ok(body.data.sources.some((s: { sourceId: string; ageSeconds: number | null }) => s.sourceId.startsWith('siurb') && s.ageSeconds === null));
  assert.equal(response.headers['cache-control'], 'no-store');
  await app.close();
});

test('deep health database failure returns sanitized service unavailable', async () => {
  const app = Fastify();
  registerDeepHealthRoute(app, async () => { throw new Error('secret database credentials'); });
  const response = await app.inject('/api/health/deep');
  assert.equal(response.statusCode, 503);
  assert.ok(!response.body.includes('secret'));
  await app.close();
});

test('deep health is public in the application and preserves database failure status', async () => {
  const { buildApp } = await import('../src/app.js');
  const app = await buildApp({ databaseUrl: 'postgres://test:test@127.0.0.1:1/unavailable' });
  try {
    const response = await app.inject('/api/health/deep');
    assert.equal(response.statusCode, 503);
    assert.ok(!response.body.includes('postgres://'));
  } finally {
    await app.close();
  }
});

test('PostgreSQL: deep health uses the latest successful run, ignoring failed runs', { skip: !process.env.DATABASE_URL }, async () => {
  const { randomUUID } = await import('node:crypto');
  const { database } = await import('../src/db.js');
  const { applyMigrations } = await import('../src/migrations.js');
  const { buildApp } = await import('../src/app.js');
  const { pool } = database();
  const ids = [randomUUID(), randomUUID(), randomUUID()];
  let app: Awaited<ReturnType<typeof buildApp>> | undefined;
  try {
    await applyMigrations(pool);
    await pool.query(`INSERT INTO source_sync_runs (id, source_id, status, coverage, finished_at)
      VALUES ($1, 'rio1746', 'success', 'complete', '2098-01-01'),
             ($2, 'rio1746', 'success', 'complete', '2099-01-01'),
             ($3, 'rio1746', 'failed', 'unknown', '2100-01-01')`, ids);
    app = await buildApp();
    const response = await app.inject('/api/health/deep');
    assert.equal(response.statusCode, 200);
    const source = response.json().data.sources.find((row: { sourceId: string }) => row.sourceId === 'rio1746');
    assert.equal(source.lastSuccessAt, '2099-01-01T00:00:00.000Z');
    assert.equal(source.ageSeconds, 0);
  } finally {
    await app?.close();
    await pool.query('DELETE FROM source_sync_runs WHERE id = ANY($1::text[])', [ids]);
    await pool.end();
  }
});
