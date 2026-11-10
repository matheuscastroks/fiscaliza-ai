import type { FastifyInstance } from 'fastify';
import { and, count, desc, eq, inArray } from 'drizzle-orm';
import type { Database } from './db.js';
import { formatOfficialCall } from './official-calls.js';
import { officialCalls, savedCalls } from './schema.js';

export const MAX_SAVED_CALLS = 500;
const callId = { type: 'string', minLength: 1, maxLength: 100 };
const ok = (data: unknown) => ({ success: true, data });
const failure = (error: string) => ({ success: false, error });

// Chamados salvos da conta. O servidor é a fonte da lista; o aplicativo guarda
// uma cópia para abrir sem internet.
export function registerSavedCallsRoutes(app: FastifyInstance, db: Database) {
  app.get('/api/v1/saved-calls', async (req) => {
    const rows = await db
      .select({ call: officialCalls, savedAt: savedCalls.savedAt })
      .from(savedCalls)
      .innerJoin(officialCalls, eq(officialCalls.id, savedCalls.callId))
      .where(eq(savedCalls.userId, req.user!.id))
      .orderBy(desc(savedCalls.savedAt))
      .limit(MAX_SAVED_CALLS);
    return ok({
      items: rows.map((row) => ({
        call: formatOfficialCall(row.call),
        savedAt: row.savedAt.toISOString(),
      })),
    });
  });

  app.put<{ Params: { callId: string } }>(
    '/api/v1/saved-calls/:callId',
    {
      schema: {
        params: {
          type: 'object',
          required: ['callId'],
          properties: { callId },
        },
      },
    },
    async (req, reply) => {
      const userId = req.user!.id;
      const [call] = await db
        .select({ id: officialCalls.id })
        .from(officialCalls)
        .where(eq(officialCalls.id, req.params.callId))
        .limit(1);
      if (!call)
        return reply.status(404).send(failure('Chamado oficial não encontrado.'));
      const [{ total }] = await db
        .select({ total: count() })
        .from(savedCalls)
        .where(eq(savedCalls.userId, userId));
      if (total >= MAX_SAVED_CALLS)
        return reply
          .status(400)
          .send(failure('Você chegou ao limite de chamados salvos.'));
      await db
        .insert(savedCalls)
        .values({ userId, callId: call.id })
        .onConflictDoNothing();
      return ok(null);
    },
  );

  // Adota vários de uma vez (lista salva antes do login). Ignora os que não existem.
  app.post<{ Body: { callIds: string[] } }>(
    '/api/v1/saved-calls/merge',
    {
      schema: {
        body: {
          type: 'object',
          required: ['callIds'],
          additionalProperties: false,
          properties: {
            callIds: { type: 'array', maxItems: 200, items: callId },
          },
        },
      },
    },
    async (req, reply) => {
      const userId = req.user!.id;
      const wanted = [...new Set(req.body.callIds)];
      if (wanted.length === 0) return ok({ added: 0 });
      const existing = await db
        .select({ id: officialCalls.id })
        .from(officialCalls)
        .where(inArray(officialCalls.id, wanted));
      const [{ total }] = await db
        .select({ total: count() })
        .from(savedCalls)
        .where(eq(savedCalls.userId, userId));
      const room = Math.max(0, MAX_SAVED_CALLS - total);
      if (room === 0)
        return reply
          .status(400)
          .send(failure('Você chegou ao limite de chamados salvos.'));
      const rows = existing
        .slice(0, room)
        .map((row) => ({ userId, callId: row.id }));
      if (rows.length === 0) return ok({ added: 0 });
      const inserted = await db
        .insert(savedCalls)
        .values(rows)
        .onConflictDoNothing()
        .returning({ callId: savedCalls.callId });
      return ok({ added: inserted.length });
    },
  );

  app.delete<{ Params: { callId: string } }>(
    '/api/v1/saved-calls/:callId',
    {
      schema: {
        params: {
          type: 'object',
          required: ['callId'],
          properties: { callId },
        },
      },
    },
    async (req) => {
      await db
        .delete(savedCalls)
        .where(
          and(
            eq(savedCalls.userId, req.user!.id),
            eq(savedCalls.callId, req.params.callId),
          ),
        );
      return ok(null);
    },
  );

  app.delete('/api/v1/saved-calls', async (req) => {
    await db.delete(savedCalls).where(eq(savedCalls.userId, req.user!.id));
    return ok(null);
  });
}
