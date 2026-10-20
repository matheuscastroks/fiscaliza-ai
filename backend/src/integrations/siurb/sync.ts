import type pg from 'pg';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Database } from '../../db.js';
import { sourceSyncRuns } from '../../schema.js';
import { dataSources } from '../../territorial-schema.js';
import type { SyncRunSummary } from '../../../../shared/contracts.js';
import { withSourceLock } from '../sync-lock.js';
import { getSiurbLayer, type SiurbLayerId } from './catalog.js';
import { readLayerSnapshot } from './client.js';
import { mapSiurbFeature } from './mapper.js';
import { ensureSiurbSources, publishSiurbSnapshot } from './repository.js';
function summary(row: typeof sourceSyncRuns.$inferSelect): SyncRunSummary {
  return {
    id: row.id,
    sourceId: row.sourceId,
    status: row.status,
    coverage: row.coverage,
    requestedStart: row.requestedStart,
    requestedEnd: row.requestedEnd,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    counters: {
      received: row.receivedCount,
      imported: row.importedCount,
      updated: row.updatedCount,
      rejected: row.rejectedCount,
    },
  };
}
export async function syncSiurbLayer(
  pool: pg.Pool,
  db: Database,
  layerId: SiurbLayerId,
  fetcher: typeof fetch = fetch,
): Promise<SyncRunSummary> {
  const layer = getSiurbLayer(layerId);
  return withSourceLock(pool, layer.sourceId, async () => {
    await ensureSiurbSources(db);
    const id = randomUUID();
    await db.insert(sourceSyncRuns).values({
      id,
      sourceId: layer.sourceId,
      status: 'running',
      coverage: 'unknown',
    });
    let received = 0,
      rejected = 0;
    try {
      const [policy] = await db
        .select()
        .from(dataSources)
        .where(eq(dataSources.id, layer.sourceId));
      if (policy.usage !== 'individual')
        throw new Error('Fonte sem autorização para publicação individual.');
      const snapshot = await readLayerSnapshot(layer, fetcher);
      received = snapshot.features.length;
      const mapped = snapshot.features.map((feature) =>
        mapSiurbFeature(layer, feature, snapshot.probe.fields),
      );
      const valid = mapped.filter((item) => item.kind === 'valid');
      const invalid = mapped.filter((item) => item.kind === 'rejected');
      rejected = invalid.length;
      if (invalid.length)
        throw new Error(`Cadastro inválido: ${invalid[0].reason}`);
      if (
        new Set(valid.map((item) => item.value.externalId)).size !==
        valid.length
      )
        throw new Error('Identidade externa duplicada no snapshot.');
      if (layer.category !== 'boundary') {
        const boundarySource = getSiurbLayer(18).sourceId;
        const [boundary] = await db
          .select()
          .from(dataSources)
          .where(eq(dataSources.id, boundarySource));
        if (!boundary?.publishedRunId)
          throw new Error('Importe primeiro os limites de bairros.');
      }
      return summary(
        await publishSiurbSnapshot(db, layer, id, snapshot, valid),
      );
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'receivedCount' in error &&
        Number.isSafeInteger(error.receivedCount)
      )
        received = Math.max(received, Number(error.receivedCount));
      await db
        .update(sourceSyncRuns)
        .set({
          status: 'failed',
          coverage: 'unknown',
          finishedAt: new Date(),
          receivedCount: received,
          rejectedCount: rejected,
          details: { error: 'Não foi possível validar e publicar a camada.' },
        })
        .where(eq(sourceSyncRuns.id, id));
      const [source] = await db
        .select()
        .from(dataSources)
        .where(eq(dataSources.id, layer.sourceId));
      await db
        .update(dataSources)
        .set({
          state:
            source.usage !== 'individual'
              ? 'restricted'
              : source.publishedRunId
                ? 'stale'
                : 'unavailable',
        })
        .where(eq(dataSources.id, layer.sourceId));
      throw error;
    }
  });
}
