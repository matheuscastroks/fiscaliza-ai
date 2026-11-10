import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayOffset, dueJobs, runDueJobs, zonedParts, type Job } from '../src/scheduler.js';

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
