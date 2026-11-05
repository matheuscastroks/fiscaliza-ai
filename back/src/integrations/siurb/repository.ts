import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '../../db.js';
import {
  dataSources,
  publicFacilities,
  territorialBoundaries,
  territorialBoundaryAliases,
} from '../../territorial-schema.js';
import { sourceSyncRuns } from '../../schema.js';
import {
  getSiurbLayer,
  SIURB_LAYER_IDS,
  type SiurbLayerSpec,
} from './catalog.js';
import { resolveFacilityNeighborhood, type MappingResult } from './mapper.js';
import type { LayerSnapshot } from './client.js';

export async function ensureSiurbSources(db: Database) {
  for (const id of SIURB_LAYER_IDS) {
    const layer = getSiurbLayer(id);
    await db
      .insert(dataSources)
      .values({
        id: layer.sourceId,
        name:
          layer.category === 'school'
            ? 'Escolas municipais'
            : layer.category === 'health'
              ? 'Unidades de saúde'
              : layer.category === 'square'
                ? 'Praças e espaços públicos'
                : 'Limites de bairros',
        provider: 'Instituto Pereira Passos / PCRJ',
        officialUrl: layer.url,
        attribution: layer.attribution,
        usage: layer.usage,
        usageEvidenceUrl: layer.usageEvidenceUrl,
      })
      .onConflictDoNothing();
  }
}
export async function publishSiurbSnapshot(
  db: Database,
  layer: SiurbLayerSpec,
  runId: string,
  snapshot: LayerSnapshot,
  mapped: Extract<MappingResult, { kind: 'valid' }>[],
) {
  return db.transaction(async (tx) => {
    const [source] = await tx
      .select()
      .from(dataSources)
      .where(eq(dataSources.id, layer.sourceId));
    if (source.usage !== 'individual')
      throw new Error('Fonte sem autorização para publicação individual.');
    if (source.publishedRunId && mapped.length === 0) {
      const table =
        layer.category === 'boundary'
          ? territorialBoundaries
          : publicFacilities;
      const [count] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(table)
        .where(
          and(
            eq(table.sourceId, layer.sourceId),
            eq(table.lastSeenRunId, source.publishedRunId),
          ),
        );
      if (count.n > 0)
        throw new Error(
          'Snapshot vazio inesperado; publicação anterior preservada.',
        );
    }
    const boundaries = await tx
      .select({ boundary: territorialBoundaries })
      .from(territorialBoundaries)
      .innerJoin(
        dataSources,
        and(
          eq(dataSources.id, territorialBoundaries.sourceId),
          eq(dataSources.publishedRunId, territorialBoundaries.lastSeenRunId),
        ),
      )
      .then((rows) => rows.map((row) => row.boundary));
    const aliases = new Map(
      (
        await tx
          .select()
          .from(territorialBoundaryAliases)
          .where(eq(territorialBoundaryAliases.sourceId, layer.sourceId))
      ).map((row) => [row.externalCode, row.boundaryId]),
    );
    let unresolved = 0,
      inserted = 0,
      updated = 0;
    for (const item of mapped) {
      if (item.type === 'boundary') {
        const row = { ...item.value, lastSeenRunId: runId };
        const [written] = await tx
          .insert(territorialBoundaries)
          .values(row)
          .onConflictDoUpdate({ target: territorialBoundaries.id, set: row })
          .returning({ inserted: sql<boolean>`(xmax = 0)` });
        if (written.inserted) inserted++;
        else updated++;
        for (const code of [row.externalId, String(Number(row.externalId))])
          await tx
            .insert(territorialBoundaryAliases)
            .values({
              sourceId: layer.sourceId,
              externalCode: code,
              boundaryId: row.id,
            })
            .onConflictDoUpdate({
              target: [
                territorialBoundaryAliases.sourceId,
                territorialBoundaryAliases.externalCode,
              ],
              set: { boundaryId: row.id },
            });
      } else {
        const boundary = resolveFacilityNeighborhood(item, boundaries, aliases);
        if (!boundary) unresolved++;
        const row = {
          ...item.value,
          neighborhoodId: boundary?.id ?? null,
          neighborhoodName: boundary?.name ?? item.reportedName,
          lastSeenRunId: runId,
        };
        const [written] = await tx
          .insert(publicFacilities)
          .values(row)
          .onConflictDoUpdate({
            target: [publicFacilities.sourceId, publicFacilities.externalId],
            set: row,
          })
          .returning({ inserted: sql<boolean>`(xmax = 0)` });
        if (written.inserted) inserted++;
        else updated++;
        if (boundary && item.reportedCode)
          await tx
            .insert(territorialBoundaryAliases)
            .values({
              sourceId: layer.sourceId,
              externalCode: item.reportedCode,
              boundaryId: boundary.id,
            })
            .onConflictDoNothing();
      }
    }
    await tx
      .update(dataSources)
      .set({
        publishedRunId: runId,
        publishedAt: new Date(),
        state: 'available',
        coverage: 'complete',
        referenceDate: snapshot.probe.referenceDate,
        sourceUpdatedAt: snapshot.probe.sourceUpdatedAt
          ? new Date(snapshot.probe.sourceUpdatedAt)
          : null,
        details: {
          mappingVersion: 'siurb-v1',
          count: mapped.length,
          unresolved,
          fields: snapshot.probe.fields,
        },
      })
      .where(eq(dataSources.id, layer.sourceId));
    const [run] = await tx
      .update(sourceSyncRuns)
      .set({
        status: 'success',
        coverage: 'complete',
        finishedAt: new Date(),
        receivedCount: snapshot.features.length,
        importedCount: inserted,
        updatedCount: updated,
        details: { mappingVersion: 'siurb-v1', unresolved },
      })
      .where(eq(sourceSyncRuns.id, runId))
      .returning();
    return run;
  });
}
