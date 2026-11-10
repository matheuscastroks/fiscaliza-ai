import { eq } from 'drizzle-orm';
import type { ReadDatabase } from './db.js';
import { dataSources, syncCheckpoints } from './schema.js';

// Versão dos dados publicados: muda quando uma sincronização termina ou
// publica uma nova versão de camada. Serve de chave para respostas em cache,
// então uma sincronização invalida o cache sem depender de tempo.
export async function dataVersion(db: ReadDatabase): Promise<string> {
  const [checkpoints, sources] = await Promise.all([
    db
      .select({
        lastSyncedAt: syncCheckpoints.lastSyncedAt,
        imported: syncCheckpoints.recordsImported,
        updated: syncCheckpoints.recordsUpdated,
        lastPartition: syncCheckpoints.lastPartition,
      })
      .from(syncCheckpoints)
      .where(eq(syncCheckpoints.id, 'rio1746_calls'))
      .limit(1),
    db
      .select({ id: dataSources.id, run: dataSources.publishedRunId })
      .from(dataSources),
  ]);
  const c = checkpoints[0];
  return JSON.stringify([
    c?.lastSyncedAt?.getTime() ?? null,
    c?.imported ?? 0,
    c?.updated ?? 0,
    c?.lastPartition ?? null,
    sources.map((s) => `${s.id}:${s.run ?? ''}`).sort(),
  ]);
}

type Entry = { version: string; at: number; value: Promise<unknown> };

// Cache pequeno em memória (LRU simples). Chamadas simultâneas com a mesma
// chave compartilham a mesma consulta.
export function createResponseCache(max = 200, ttlMs = 5 * 60_000) {
  const entries = new Map<string, Entry>();
  return {
    async get<T>(
      key: string,
      version: string,
      compute: () => Promise<T>,
    ): Promise<T> {
      const hit = entries.get(key);
      if (hit && hit.version === version && Date.now() - hit.at < ttlMs) {
        entries.delete(key);
        entries.set(key, hit); // mais recente
        return hit.value as Promise<T>;
      }
      const value = compute();
      entries.set(key, { version, at: Date.now(), value });
      value.catch(() => {
        if (entries.get(key)?.value === value) entries.delete(key);
      });
      if (entries.size > max) entries.delete(entries.keys().next().value!);
      return value;
    },
    clear: () => entries.clear(),
  };
}
export type ResponseCache = ReturnType<typeof createResponseCache>;
