// Agendador: roda as sincronizações e a limpeza em horários fixos, no horário
// de Brasília. Fica num container próprio (a mesma imagem da API) e usa o lock
// por fonte que já existe, então duas execuções nunca se sobrepõem.
import { lt } from 'drizzle-orm';
import { database, type Database } from './db.js';
import { notifyStatusChanges } from './notifications.js';
import { runRio1746RangeSync } from './integrations/rio1746/sync.js';
import { syncSiurbLayer } from './integrations/siurb/sync.js';
import { sessions } from './schema.js';
import { loadConfig } from './config.js';
import { removeOrphanAttachments } from './orphans.js';
import type pg from 'pg';

export type Job = {
  name: string;
  hour: number;
  minute: number;
  /** 0 = domingo. Sem valor, roda todo dia. */
  weekday?: number;
  run: () => Promise<unknown>;
};

const TIME_ZONE = 'America/Sao_Paulo';

export function zonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)!.value;
  return {
    day: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
      get('weekday'),
    ),
  };
}

/** Tarefas que já passaram do horário hoje e ainda não rodaram hoje. */
export function dueJobs(
  now: Date,
  jobs: Job[],
  lastRunDay: Map<string, string>,
): Job[] {
  const { day, hour, minute, weekday } = zonedParts(now);
  return jobs.filter(
    (job) =>
      (job.weekday === undefined || job.weekday === weekday) &&
      (hour > job.hour || (hour === job.hour && minute >= job.minute)) &&
      lastRunDay.get(job.name) !== day,
  );
}

/** Dia (AAAA-MM-DD, horário de Brasília) deslocado `days` dias de `now`. */
export function dayOffset(now: Date, days: number): string {
  return zonedParts(new Date(now.getTime() + days * 86_400_000)).day;
}

async function ping(url: string | undefined, suffix = '') {
  if (!url) return;
  try {
    await fetch(url.replace(/\/$/, '') + suffix, {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Monitor fora do ar não pode derrubar o agendador.
  }
}

export function buildJobs(db: Database, pool: pg.Pool, now = () => new Date()): Job[] {
  const syncDays = Math.min(7, Math.max(1, Number(process.env.RIO1746_SYNC_DAYS) || 2));
  return [
    {
      name: 'rio1746',
      hour: 4,
      minute: 0,
      run: () =>
        runRio1746RangeSync(
          db,
          pool,
          dayOffset(now(), -syncDays),
          dayOffset(now(), -1),
          {
            retries: 3,
            onStatusChanges: async (changes) => {
              const sent = await notifyStatusChanges(db, changes);
              console.log(
                `[scheduler] ${changes.length} chamados mudaram de situação; ${sent} avisos enviados.`,
              );
            },
          },
        ),
    },
    {
      name: 'siurb',
      hour: 5,
      minute: 0,
      weekday: 0,
      run: async () => {
        for (const id of [18, 1, 2, 16] as const)
          await syncSiurbLayer(pool, db, id);
      },
    },
    {
      name: 'fotos-orfas',
      hour: 3,
      minute: 45,
      run: () => removeOrphanAttachments(db, loadConfig().uploadDir),
    },
    {
      name: 'limpeza-de-sessoes',
      hour: 3,
      minute: 30,
      run: () => db.delete(sessions).where(lt(sessions.expiresAt, new Date())),
    },
  ];
}

export async function runDueJobs(
  jobs: Job[],
  lastRunDay: Map<string, string>,
  now: Date,
  log: (message: string) => void = console.log,
  pingUrl = process.env.HEALTHCHECK_PING_URL,
) {
  for (const job of dueJobs(now, jobs, lastRunDay)) {
    // Marca antes: uma falha não deve repetir a tarefa a cada minuto.
    lastRunDay.set(job.name, zonedParts(now).day);
    const started = Date.now();
    try {
      await job.run();
      log(`[scheduler] ${job.name} concluída em ${Math.round((Date.now() - started) / 1000)}s`);
      await ping(pingUrl);
    } catch (error) {
      log(
        `[scheduler] ${job.name} falhou: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
      );
      await ping(pingUrl, '/fail');
    }
  }
}

export async function startScheduler() {
  const { db, pool } = database();
  const jobs = buildJobs(db, pool);
  const lastRunDay = new Map<string, string>();
  // Ao subir, não repete o que já passou do horário hoje: só o que vier depois.
  const today = zonedParts(new Date()).day;
  for (const job of dueJobs(new Date(), jobs, new Map()))
    lastRunDay.set(job.name, today);
  // As tarefas são repetíveis e o lock por fonte vive na conexão: sair na hora é seguro.
  for (const signal of ['SIGINT', 'SIGTERM'] as const)
    process.on(signal, () => process.exit(0));
  console.log(`[scheduler] ativo: ${jobs.map((job) => job.name).join(', ')}`);
  for (;;) {
    await runDueJobs(jobs, lastRunDay, new Date());
    await new Promise((resolve) => setTimeout(resolve, 30_000));
  }
}
