import type { FastifyInstance } from 'fastify';
import { ok } from './http-errors.js';

export const HEALTH_SOURCE_IDS = [
  'rio1746', 'siurb-schools', 'siurb-health', 'siurb-squares', 'siurb-neighborhoods',
] as const;

type SuccessfulSync = { sourceId: string; finishedAt: Date | null };

// Freshness is reported separately from database availability: a successful
// query does not imply that the imported data is current or complete.
export function registerDeepHealthRoute(
  app: FastifyInstance,
  readSuccessfulSyncs: () => Promise<SuccessfulSync[]>,
  now: () => Date = () => new Date(),
) {
  app.get('/api/health/deep', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    try {
      const rows = await readSuccessfulSyncs();
      const checkedAt = now();
      const sources = HEALTH_SOURCE_IDS.map((sourceId) => {
        const lastSuccessAt = rows.find((row) => row.sourceId === sourceId)?.finishedAt ?? null;
        return {
          sourceId,
          lastSuccessAt: lastSuccessAt?.toISOString() ?? null,
          ageSeconds: lastSuccessAt
            ? Math.max(0, Math.floor((checkedAt.getTime() - lastSuccessAt.getTime()) / 1000))
            : null,
        };
      });
      return ok({ status: 'ok', checkedAt: checkedAt.toISOString(), sources });
    } catch (error) {
      request.log.error({ err: error }, 'Falha ao verificar saúde das sincronizações.');
      return reply.code(503).send({ success: false, error: 'Não foi possível verificar as sincronizações.' });
    }
  });
}
