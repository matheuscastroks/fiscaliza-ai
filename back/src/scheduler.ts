// Agendador: roda as sincronizações e a limpeza em horários fixos, no horário
// de Brasília. Fica num container próprio (a mesma imagem da API) e usa o lock
// por fonte que já existe, então duas execuções nunca se sobrepõem.
import { lt, sql } from 'drizzle-orm';
import { database, type Database } from './db.js';
import { notifyPendingFollowers } from './notifications.js';
import { runRio1746RangeSync } from './integrations/rio1746/sync.js';
import { syncSiurbLayer } from './integrations/siurb/sync.js';
import { sessions } from './schema.js';
import { uploadDirFrom } from './config.js';
import { removeOrphanAttachments } from './orphans.js';
import { flushMonitoring, reportError } from './monitoring.js';
import type pg from 'pg';

export type Job = {
  name: string;
  hour: number;
  minute: number;
  /** 0 = domingo. Sem valor, roda todo dia. */
  weekday?: number;
  run: () => Promise<unknown>;
  /**
   * Diz, pelo banco, se a tarefa já rodou no dia (AAAA-MM-DD, Brasília). Sem
   * isso, a tarefa é considerada barata e repetível: roda de novo ao reiniciar.
   */
  ranOn?: (day: string) => Promise<boolean>;
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

/** Houve execução concluída (total ou parcial) das fontes no dia, em Brasília. */
export async function sourceRanOn(
  db: Database,
  sourcePattern: string,
  day: string,
): Promise<boolean> {
  const result = await db.execute<{ found: boolean }>(sql`
    SELECT EXISTS (
      SELECT 1 FROM source_sync_runs
      WHERE source_id LIKE ${sourcePattern}
        AND status IN ('success', 'partial')
        AND (started_at AT TIME ZONE ${TIME_ZONE})::date = ${day}::date
    ) AS found
  `);
  return Boolean(result.rows[0]?.found);
}

/**
 * Uma execução que ficou `running` por mais de uma hora foi interrompida
 * (reinício, queda do container): passa a `failed` para não parecer em curso.
 */
export async function failStaleRuns(db: Database, olderThanMinutes = 60): Promise<number> {
  const result = await db.execute(sql`
    UPDATE source_sync_runs
    SET status = 'failed',
        coverage = 'unknown',
        finished_at = now(),
        details = details || '{"error": "Execução interrompida antes de terminar."}'::jsonb
    WHERE status = 'running'
      AND started_at < now() - make_interval(mins => ${olderThanMinutes})
  `);
  return result.rowCount ?? 0;
}

export function buildJobs(db: Database, pool: pg.Pool, now = () => new Date()): Job[] {
  const syncDays = Math.min(7, Math.max(1, Number(process.env.RIO1746_SYNC_DAYS) || 2));
  return [
    {
      name: 'rio1746',
      hour: 4,
      minute: 0,
      ranOn: (day) => sourceRanOn(db, 'rio1746', day),
      run: async () => {
        try {
          await runRio1746RangeSync(
            db,
            pool,
            dayOffset(now(), -syncDays),
            dayOffset(now(), -1),
            { retries: 3, revisitTracked: true },
          );
        } finally {
          // Mesmo com a sincronização parcial ou falha, o que já foi gravado e
          // ainda não foi avisado (inclusive envios que falharam antes) sai agora.
          const sent = await notifyPendingFollowers(db);
          if (sent > 0) console.log(`[scheduler] ${sent} avisos de mudança de situação enviados.`);
        }
      },
    },
    {
      name: 'siurb',
      hour: 5,
      minute: 0,
      weekday: 0,
      ranOn: (day) => sourceRanOn(db, 'siurb-%', day),
      run: async () => {
        for (const id of [18, 1, 2, 16] as const)
          await syncSiurbLayer(pool, db, id);
      },
    },
    {
      name: 'fotos-orfas',
      hour: 3,
      minute: 45,
      run: () => removeOrphanAttachments(db, uploadDirFrom()),
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
      reportError(error, { job: job.name });
      await ping(pingUrl, '/fail');
    }
  }
}

/**
 * Na subida, só dá por feita a tarefa que o banco confirma ter rodado hoje. A
 * que caiu no meio (deploy, reinício) ou falhou volta a rodar; antes, ela só
 * voltaria no dia seguinte (a semanal, uma semana depois).
 */
export async function initialLastRunDay(
  jobs: Job[],
  now: Date,
  log: (message: string) => void = console.log,
): Promise<Map<string, string>> {
  const today = zonedParts(now).day;
  const lastRunDay = new Map<string, string>();
  for (const job of dueJobs(now, jobs, new Map())) {
    try {
      if (job.ranOn && (await job.ranOn(today))) lastRunDay.set(job.name, today);
    } catch (error) {
      // Sem como confirmar, não repete: melhor perder uma rodada que duplicar.
      lastRunDay.set(job.name, today);
      log(`[scheduler] não deu para conferir ${job.name}: ${error instanceof Error ? error.message : error}`);
    }
  }
  return lastRunDay;
}

export async function startScheduler() {
  const { db, pool } = database();
  const jobs = buildJobs(db, pool);
  const stale = await failStaleRuns(db);
  if (stale > 0) console.log(`[scheduler] ${stale} execuções interrompidas marcadas como falha.`);
  const lastRunDay = await initialLastRunDay(jobs, new Date());

  let current: Promise<unknown> | null = null;
  let stopping = false;
  for (const signal of ['SIGINT', 'SIGTERM'] as const)
    process.on(signal, () => {
      if (stopping) process.exit(1);
      stopping = true;
      // Espera a tarefa em curso terminar (até 25 s, abaixo do prazo do Docker).
      const deadline = new Promise((resolve) => setTimeout(resolve, 25_000).unref());
      void Promise.race([current ?? Promise.resolve(), deadline])
        .finally(() => flushMonitoring())
        .finally(() => pool.end().catch(() => undefined))
        .finally(() => process.exit(0));
    });
  console.log(`[scheduler] ativo: ${jobs.map((job) => job.name).join(', ')}`);
  while (!stopping) {
    current = runDueJobs(jobs, lastRunDay, new Date());
    await current;
    current = null;
    await new Promise((resolve) => setTimeout(resolve, 30_000));
  }
}
