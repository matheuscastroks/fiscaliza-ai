import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildJobs,
  dayOffset,
  dueJobs,
  failStaleRuns,
  initialLastRunDay,
  runDueJobs,
  sourceRanOn,
  zonedParts,
  type Job,
} from '../src/scheduler.js';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { database } from '../src/db.js';
import { applyMigrations } from '../src/migrations.js';
import { sourceSyncRuns } from '../src/schema.js';

const at = (iso: string) => new Date(iso);
const job = (name: string, hour: number, minute: number, extra: Partial<Job> = {}): Job => ({
  name,
  hour,
  minute,
  run: async () => undefined,
  ...extra,
});

test('agendador: usa o horário de Brasília', () => {
  // 07:30 UTC = 04:30 em Brasília (terça-feira)
  assert.deepEqual(zonedParts(at('2026-11-10T07:30:00Z')), {
    day: '2026-11-10',
    hour: 4,
    minute: 30,
    weekday: 2,
  });
  // 01:00 UTC ainda é o dia anterior em Brasília
  assert.equal(zonedParts(at('2026-11-10T01:00:00Z')).day, '2026-11-09');
  assert.equal(dayOffset(at('2026-11-10T07:30:00Z'), -1), '2026-11-09');
});

test('agendador: roda uma vez por dia depois do horário e respeita o dia da semana', () => {
  const daily = job('diaria', 4, 0);
  const sunday = job('semanal', 5, 0, { weekday: 0 });
  const last = new Map<string, string>();
  assert.deepEqual(dueJobs(at('2026-11-10T06:59:00Z'), [daily, sunday], last), []); // 03:59
  assert.deepEqual(dueJobs(at('2026-11-10T07:00:00Z'), [daily, sunday], last).map((j) => j.name), ['diaria']);
  // domingo 2026-11-15
  assert.deepEqual(
    dueJobs(at('2026-11-15T08:00:00Z'), [daily, sunday], last).map((j) => j.name),
    ['diaria', 'semanal'],
  );
  last.set('diaria', '2026-11-10');
  assert.deepEqual(dueJobs(at('2026-11-10T20:00:00Z'), [daily], last), []);
  assert.equal(dueJobs(at('2026-11-11T07:00:00Z'), [daily], last).length, 1);
});

test('agendador: avisa o monitor no sucesso e na falha, e não repete a tarefa que falhou no mesmo dia', async (t) => {
  const pings: string[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request) => {
    pings.push(String(url));
    return new Response('ok');
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = realFetch;
  });
  let runs = 0;
  const logs: string[] = [];
  const jobs = [
    job('boa', 4, 0, { run: async () => void (runs += 1) }),
    job('ruim', 4, 0, {
      run: async () => {
        runs += 1;
        throw new Error('quebrou');
      },
    }),
  ];
  const last = new Map<string, string>();
  const now = at('2026-11-10T08:00:00Z');
  await runDueJobs(jobs, last, now, (m) => logs.push(m), 'https://hc.example/ping/abc');
  await runDueJobs(jobs, last, now, (m) => logs.push(m), 'https://hc.example/ping/abc');
  assert.equal(runs, 2);
  assert.deepEqual(pings, ['https://hc.example/ping/abc', 'https://hc.example/ping/abc/fail']);
  assert.ok(logs.some((line) => line.includes('ruim falhou: quebrou')));
});

test('agendador: a limpeza de fotos roda com a configuração de produção do container', async (t) => {
  // O container do agendador não define WEB_ORIGINS nem TRUST_PROXY (são da API).
  const saved = { ...process.env };
  t.after(() => {
    process.env = saved;
  });
  process.env.NODE_ENV = 'production';
  delete process.env.WEB_ORIGINS;
  delete process.env.TRUST_PROXY;
  process.env.UPLOAD_DIR = '/tmp/fiscaliza-uploads-teste';
  const db = {
    execute: async () => ({ rows: [] }),
  } as unknown as Parameters<typeof buildJobs>[0];
  const orphans = buildJobs(db, {} as Parameters<typeof buildJobs>[1]).find(
    (item) => item.name === 'fotos-orfas',
  )!;
  assert.equal(await orphans.run(), 0);
});

test('agendador: ao reiniciar, só pula a tarefa que o banco confirma ter rodado hoje', async () => {
  // 10:00 em Brasília: as três já passaram do horário.
  const now = at('2026-11-10T13:00:00Z');
  const jobs = [
    job('rodou', 4, 0, { ranOn: async (day) => day === '2026-11-10' }),
    job('caiu-no-meio', 4, 30, { ranOn: async () => false }),
    job('barata', 3, 0),
    job('sem-banco', 5, 0, {
      ranOn: async () => {
        throw new Error('banco fora');
      },
    }),
  ];
  const last = await initialLastRunDay(jobs, now, () => undefined);
  assert.deepEqual(
    dueJobs(now, jobs, last).map((item) => item.name),
    ['caiu-no-meio', 'barata'],
  );
});

test(
  'PostgreSQL: execução presa em running vira failed e conta como não rodada',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { db, pool } = database();
    const ids = [randomUUID(), randomUUID()];
    t.after(async () => {
      for (const id of ids) await db.delete(sourceSyncRuns).where(eq(sourceSyncRuns.id, id));
      await pool.end();
    });
    await applyMigrations(pool);
    const sourceId = `teste-${randomUUID()}`;
    await db.insert(sourceSyncRuns).values([
      {
        id: ids[0],
        sourceId,
        status: 'running',
        coverage: 'unknown',
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      { id: ids[1], sourceId, status: 'running', coverage: 'unknown' },
    ]);
    assert.ok((await failStaleRuns(db)) >= 1);
    const rows = await db.select().from(sourceSyncRuns).where(eq(sourceSyncRuns.sourceId, sourceId));
    const byId = new Map(rows.map((row) => [row.id, row.status]));
    assert.equal(byId.get(ids[0]), 'failed');
    assert.equal(byId.get(ids[1]), 'running', 'a execução recente pode estar em curso');

    const today = zonedParts(new Date()).day;
    assert.equal(await sourceRanOn(db, sourceId, today), false);
    await db.update(sourceSyncRuns).set({ status: 'partial' }).where(eq(sourceSyncRuns.id, ids[1]));
    assert.equal(await sourceRanOn(db, sourceId, today), true);
  },
);
