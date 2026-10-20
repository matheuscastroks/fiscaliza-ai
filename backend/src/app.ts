import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import { and, desc, eq, gt, inArray, ne, sql } from 'drizzle-orm';
import Fastify, { type FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';
import sharp from 'sharp';
import type {
  CivicItem,
  CivicTerritory,
  Occurrence,
  SessionUser,
} from '../../shared/contracts.js';
import { analyze } from './analysis.js';
import { newToken, tokenHash, verifyPassword } from './auth.js';
import { applyCivicUpdate } from './civic.js';
import { canDeleteRecord } from '../../shared/record-deletion.js';
import { database, type Database } from './db.js';
import { municipalityService } from './municipality.js';
import { summarizeOverview } from './overview.js';
import {
  answers,
  demoEngagement,
  attachments,
  municipalities,
  records,
  relations,
  sessions,
  users,
} from './schema.js';
import { seed } from './seed-data.js';
import { registerOfficialCallsRoutes } from './official-calls.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: SessionUser | null;
    sessionToken: string | null;
  }
}
const string = (max = 5000, min = 1) => ({
  type: 'string',
  minLength: min,
  maxLength: max,
  ...(min > 0 ? { pattern: '\\S' } : {}),
});
const enumeration = (values: string[]) => ({ type: 'string', enum: values });
const object = (
  properties: Record<string, unknown>,
  required: string[] = [],
) => ({ type: 'object', properties, required, additionalProperties: false });
const category = enumeration(['road', 'lighting', 'cleaning', 'others']);
const status = enumeration(['pending', 'in_progress', 'resolved']);
const location = object(
  {
    latitude: { type: 'number', minimum: -90, maximum: 90 },
    longitude: { type: 'number', minimum: -180, maximum: 180 },
    address: string(300),
    neighborhood: string(120),
  },
  ['latitude', 'longitude', 'address'],
);
const civicTerritory = {
  oneOf: [
    object({ scope: { const: 'municipality' } }, ['scope']),
    object({ scope: { const: 'neighborhood' }, neighborhood: string(120) }, [
      'scope',
      'neighborhood',
    ]),
    object(
      {
        scope: { const: 'location' },
        neighborhood: string(120),
        location: object(
          {
            latitude: { type: 'number', minimum: -90, maximum: 90 },
            longitude: { type: 'number', minimum: -180, maximum: 180 },
            address: string(300),
          },
          ['latitude', 'longitude'],
        ),
      },
      ['scope', 'neighborhood', 'location'],
    ),
  ],
};
const images = {
  type: 'array',
  maxItems: 8,
  items: { type: 'string', pattern: '^/api/attachments/[a-f0-9-]{36}$' },
};
const fail = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode });
const ok = (data: unknown) => ({ success: true, data });
const now = () => new Date().toISOString();
const sessionCookie = (req: FastifyRequest) =>
  req.headers['x-fiscaliza-client'] === 'citizen'
    ? 'citizen_session'
    : 'session';
const publicUser = (u: typeof users.$inferSelect): SessionUser => ({
  id: u.id,
  name: u.name,
  avatar: u.avatar ?? undefined,
  email: u.email,
  role: u.role,
  postalCode: u.postalCode ?? undefined,
  neighborhood: u.neighborhood ?? undefined,
  municipality: null,
  ...(u.sector ? { sector: u.sector } : {}),
});
const staff = (req: FastifyRequest) => {
  if (!req.user || req.user.role === 'citizen')
    throw fail(403, 'Acesso restrito à gestão.');
  return req.user;
};
type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];

export async function buildApp(
  options: {
    databaseUrl?: string;
    logger?: boolean;
    fetch?: typeof fetch;
  } = {},
) {
  const trustedProxies = process.env.TRUST_PROXY?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const app = Fastify({
    logger: options.logger ?? false,
    trustProxy: trustedProxies?.length ? trustedProxies : false,
    bodyLimit: 1024 * 1024,
    ajv: { customOptions: { removeAdditional: false } },
  });
  const connection = database(options.databaseUrl);
  const db = connection.db;
  const territory = municipalityService(db, options.fetch);
  const locks = new pg.Pool({
    connectionString:
      options.databaseUrl ??
      process.env.DATABASE_URL ??
      'postgres://fiscaliza:fiscaliza@localhost:5432/fiscaliza',
    max: 20,
  });
  async function hydrate(u: typeof users.$inferSelect): Promise<SessionUser> {
    const result = publicUser(u);
    if (u.municipalityId) {
      const [m] = await db
        .select()
        .from(municipalities)
        .where(eq(municipalities.id, u.municipalityId));
      result.municipality = m?.data ?? null;
    }
    return result;
  }
  const municipalityId = (req: FastifyRequest) => {
    if (!req.user) throw fail(401, 'Entre para continuar.');
    if (!req.user.municipality)
      throw fail(403, 'Confirme seu município pelo CEP para continuar.');
    return req.user.municipality.id;
  };
  const origins = (
    process.env.WEB_ORIGINS || 'http://localhost:5173,http://localhost:8081'
  )
    .split(',')
    .map((x) => x.trim());
  const isAllowedOrigin = (origin: string): boolean => {
    if (origins.includes(origin)) return true;
    if (process.env.NODE_ENV !== 'production') {
      if (origin === 'null') return true;
      if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)) return true;
      if (
        /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(
          origin,
        )
      )
        return true;
      if (/^exp:\/\//.test(origin)) return true;
    }
    return false;
  };
  const uploadDir = resolve(process.env.UPLOAD_DIR || 'uploads');
  app.addHook('onClose', async () => {
    await connection.pool.end();
    await locks.end();
  });
  await app.register(swagger, {
    openapi: {
      info: { title: 'Fiscaliza aí API', version: '1.0.0' },
      components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } },
      },
    },
  });
  await app.register(cookie);
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || isAllowedOrigin(origin)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
  });
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  app.decorateRequest('user', null);
  app.decorateRequest('sessionToken', null);
  // Handler ownership keeps the lock paired with finally even when the socket
  // closes before Fastify can emit onResponse. JSON parsing/validation runs first.
  app.addHook('onRoute', (route) => {
    const handler = route.handler;
    route.handler = async function (req, reply) {
      if (!req.user || ['GET', 'HEAD', 'OPTIONS'].includes(req.method))
        return handler.call(this, req, reply);
      const userId = req.user.id;
      const lock = await locks.connect();
      let acquired = false;
      try {
        if (req.raw.aborted || req.raw.socket.destroyed)
          throw fail(499, 'Request aborted.');
        await lock.query('SELECT pg_advisory_lock(hashtext($1))', [userId]);
        acquired = true;
        // A disconnected request may have waited behind an active mutation.
        if (req.raw.aborted || req.raw.socket.destroyed)
          throw fail(499, 'Request aborted.');
        const [fresh] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));
        if (!fresh) throw fail(401, 'Sessao expirada.');
        req.user = await hydrate(fresh);
        const path = req.url.split('?')[0];
        if (!path.startsWith('/api/auth/') && !path.startsWith('/api/profile/'))
          municipalityId(req);
        if (req.raw.aborted || req.raw.socket.destroyed)
          throw fail(499, 'Request aborted.');
        return await handler.call(this, req, reply);
      } finally {
        // Never release while the handler may still be writing to the database.
        try {
          if (acquired)
            await lock.query('SELECT pg_advisory_unlock(hashtext($1))', [
              userId,
            ]);
          lock.release();
        } catch {
          lock.release(true);
        }
      }
    };
  });
  app.setErrorHandler((caught, _request, reply) => {
    const error: Error & { statusCode?: number } =
      caught instanceof Error ? caught : new Error('Erro desconhecido.');
    const statusCode =
      error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    if (statusCode === 500) app.log.error(error);
    reply.code(statusCode).send({
      success: false,
      error:
        statusCode === 500
          ? 'Não foi possível concluir a operação.'
          : error.message,
    });
  });
  app.setNotFoundHandler((_req, reply) =>
    reply.code(404).send({ success: false, error: 'Recurso não encontrado.' }),
  );
  app.addHook('onRequest', async (req) => {
    if (!req.url.startsWith('/api/')) return;
    const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    const bearer = req.headers.authorization?.match(
      /^Bearer ([A-Za-z0-9_-]+)$/,
    )?.[1];
    const isLogin = req.url === '/api/auth/login';
    if (
      !isLogin &&
      mutation &&
      !bearer &&
      req.cookies[sessionCookie(req)] &&
      (!req.headers.origin || !isAllowedOrigin(req.headers.origin))
    )
      throw fail(403, 'Origem não autorizada.');
    if (
      !isLogin &&
      req.headers.origin &&
      mutation &&
      !isAllowedOrigin(req.headers.origin)
    )
      throw fail(403, 'Origem não autorizada.');
    const token = bearer || req.cookies[sessionCookie(req)];
    if (token) {
      const [row] = await db
        .select({ user: users })
        .from(sessions)
        .innerJoin(users, eq(users.id, sessions.userId))
        .where(
          and(
            eq(sessions.tokenHash, tokenHash(token)),
            gt(sessions.expiresAt, new Date()),
          ),
        );
      if (row) {
        req.user = await hydrate(row.user);
        req.sessionToken = token;
      }
    }
    if (mutation && req.url !== '/api/auth/login' && !req.user)
      throw fail(401, 'Entre para continuar.');
    const path = req.url.split('?')[0];
    if (
      !path.startsWith('/api/auth/') &&
      !path.startsWith('/api/profile/') &&
      path !== '/api/health' &&
      !(req.method === 'GET' && path.startsWith('/api/rio1746/')) &&
      !(
        req.method === 'GET' &&
        (path === '/api/activity' || path.startsWith('/api/activity/'))
      ) &&
      !(
        req.method === 'GET' &&
        (path.startsWith('/api/attachments/') ||
          path.startsWith('/api/demo-media/'))
      )
    )
      municipalityId(req);
  });
  app.get('/health', async () => ok({ status: 'ok' }));
  app.get('/api/health', async () => {
    await connection.pool.query('SELECT 1');
    return ok({ status: 'ok' });
  });
  app.post<{ Body: { email: string; password: string } }>(
    '/api/auth/login',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
      schema: {
        body: object({ email: string(254), password: string(256) }, [
          'email',
          'password',
        ]),
      },
    },
    async (req, reply) => {
      const [u] = await db
        .select()
        .from(users)
        .where(eq(users.email, req.body.email.toLowerCase().trim()));
      if (!u || !(await verifyPassword(req.body.password, u.passwordHash)))
        throw fail(401, 'E-mail ou senha inválidos.');
      const token = newToken();
      await db.insert(sessions).values({
        tokenHash: tokenHash(token),
        userId: u.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      reply.setCookie(sessionCookie(req), token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/api',
        maxAge: 7 * 24 * 60 * 60,
      });
      return ok({ user: await hydrate(u), token });
    },
  );
  app.get('/api/auth/me', async (req) => {
    if (!req.user) throw fail(401, 'Sessão expirada.');
    return ok(req.user);
  });
  app.put<{ Body: { avatar: string } }>(
    '/api/profile/avatar',
    { schema: { body: object({ avatar: images.items }, ['avatar']) } },
    async (req) => {
      await validateImages(req, [req.body.avatar]);
      const [updated] = await db
        .update(users)
        .set({ avatar: req.body.avatar })
        .where(eq(users.id, req.user!.id))
        .returning();
      return ok(await hydrate(updated));
    },
  );
  app.post('/api/auth/logout', async (req, reply) => {
    if (req.sessionToken)
      await db
        .delete(sessions)
        .where(eq(sessions.tokenHash, tokenHash(req.sessionToken)));
    reply.clearCookie(sessionCookie(req), { path: '/api' });
    return ok(null);
  });

  app.get<{ Params: { cep: string } }>(
    '/api/profile/postal-code/:cep',
    async (req) => {
      if (!req.user) throw fail(401, 'Entre para continuar.');
      return ok(await territory.lookup(req.params.cep));
    },
  );
  app.put<{ Body: { postalCode: string; municipalityId: string } }>(
    '/api/profile/municipality',
    {
      schema: {
        body: object(
          {
            postalCode: string(9),
            municipalityId: { type: 'string', pattern: '^[0-9]{7}$' },
          },
          ['postalCode', 'municipalityId'],
        ),
      },
    },
    async (req) => {
      if (req.user!.role !== 'citizen')
        throw fail(
          403,
          'O município da gestão é definido pela autorização da conta.',
        );
      const found = await territory.lookup(req.body.postalCode);
      if (found.municipality.id !== req.body.municipalityId)
        throw fail(
          400,
          'O município confirmado não corresponde ao CEP. Consulte novamente.',
        );
      const [user] = await db
        .update(users)
        .set({
          municipalityId: found.municipality.id,
          postalCode: found.postalCode,
          neighborhood: found.neighborhood,
        })
        .where(eq(users.id, req.user!.id))
        .returning();
      return ok(await hydrate(user));
    },
  );
  app.get('/api/municipality', async (req) => ok(req.user!.municipality));
  registerOfficialCallsRoutes(app, db, connection.pool, ok, fail);

  async function present(
    row: typeof records.$inferSelect,
    uid?: string,
    tx: Database | Tx = db,
  ): Promise<Occurrence | CivicItem> {
    const value = structuredClone(row.data);
    value.municipalityId = row.municipalityId;
    let managementComment = false;
    if (value.comments.length) {
      const authors = await tx
        .select({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          role: users.role,
        })
        .from(users)
        .where(
          inArray(users.id, [
            ...new Set(value.comments.map((comment) => comment.userId)),
          ]),
        );
      const profiles = new Map(authors.map((author) => [author.id, author]));
      managementComment = authors.some((author) => author.role !== 'citizen');
      value.comments = value.comments.map((comment) => {
        const author = profiles.get(comment.userId);
        return {
          ...comment,
          userName: author?.name || comment.userName,
          ...(author?.avatar ? { avatar: author.avatar } : {}),
        };
      });
    }
    const reverse = await tx
      .select({ id: records.id, kind: records.kind })
      .from(records)
      .where(
        and(
          eq(records.municipalityId, row.municipalityId),
          sql`${records.data}->'linkedIds' @> ${JSON.stringify([row.id])}::jsonb`,
        ),
      );
    if ('kind' in value)
      value.linkedIds = [
        ...new Set([...value.linkedIds, ...reverse.map((r) => r.id)]),
      ];
    else value.relatedIds = reverse.map((r) => r.id);
    value.canDelete =
      row.authorId === uid &&
      canDeleteRecord(value) &&
      !managementComment &&
      !reverse.some(
        (record) => record.kind === 'action' || record.kind === 'consultation',
      );
    const rs = await tx
      .select()
      .from(relations)
      .where(eq(relations.recordId, row.id));
    const [baseline] = await tx
      .select()
      .from(demoEngagement)
      .where(eq(demoEngagement.recordId, row.id));
    value.views =
      (baseline?.views || 0) + rs.filter((x) => x.kind === 'view').length;
    const support = rs.filter((x) => x.kind === 'support');
    if ('votes' in value)
      value.votes = (baseline?.supports || 0) + support.length;
    else value.supports = (baseline?.supports || 0) + support.length;
    value.supportedByMe = support.some((x) => x.userId === uid);
    value.followedByMe = rs.some(
      (x) => x.kind === 'follow' && x.userId === uid,
    );
    if ('kind' in value && value.kind === 'consultation') {
      const responses = await tx
        .select()
        .from(answers)
        .where(eq(answers.recordId, row.id));
      value.answerCounts = value.options.map(
        (_, i) => responses.filter((a) => a.option === i).length,
      );
      value.myAnswer = responses.find((a) => a.userId === uid)?.option;
    }
    return value;
  }
  async function find(
    municipality: string,
    id: string,
    kind: 'occurrence' | 'civic',
    tx: Database | Tx = db,
    lock = false,
  ) {
    const query = tx
      .select()
      .from(records)
      .where(
        and(
          eq(records.id, id),
          eq(records.municipalityId, municipality),
          kind === 'occurrence'
            ? eq(records.kind, 'occurrence')
            : ne(records.kind, 'occurrence'),
        ),
      );
    const [row] = await (lock ? query.for('update') : query);
    if (!row) throw fail(404, 'Registro não encontrado.');
    return row;
  }
  async function normalizeCivicTerritory(
    req: FastifyRequest,
    value?: CivicTerritory,
  ) {
    if (!value) return undefined;
    if (value.scope === 'municipality')
      return { scope: 'municipality' } as const;
    const neighborhood = value.neighborhood.trim();
    if (!neighborhood) throw fail(400, 'Informe o bairro.');
    if (value.scope === 'neighborhood')
      return { scope: 'neighborhood', neighborhood } as const;
    await territory.validatePoint(municipalityId(req), value.location);
    return {
      scope: 'location',
      neighborhood,
      location: {
        latitude: value.location.latitude,
        longitude: value.location.longitude,
        ...(value.location.address
          ? { address: value.location.address.trim() }
          : {}),
      },
    } as const;
  }
  async function validateImages(
    req: FastifyRequest,
    values: string[] | undefined,
  ) {
    for (const value of values ?? []) {
      const [attachment] = await db
        .select({ id: attachments.id })
        .from(attachments)
        .where(
          and(
            eq(attachments.id, value.split('/').at(-1)!),
            eq(attachments.municipalityId, municipalityId(req)),
            eq(attachments.ownerId, req.user!.id),
          ),
        );
      if (!attachment) throw fail(400, 'Anexo não encontrado.');
    }
  }
  const pagination = object({
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    offset: { type: 'integer', minimum: 0, maximum: 100000, default: 0 },
    kind: enumeration(['proposal', 'consultation', 'action']),
    status: string(30),
    category,
    userId: string(100),
  });
  for (const [path, kind] of [
    ['occurrences', 'occurrence'],
    ['civic-items', 'civic'],
  ] as const) {
    app.get<{
      Querystring: {
        limit?: number;
        offset?: number;
        kind?: string;
        status?: string;
        category?: string;
        userId?: string;
      };
    }>(`/api/${path}`, { schema: { querystring: pagination } }, async (req) => {
      const q = req.query;
      const where = and(
        eq(records.municipalityId, municipalityId(req)),
        kind === 'occurrence'
          ? eq(records.kind, 'occurrence')
          : q.kind
            ? eq(records.kind, q.kind)
            : ne(records.kind, 'occurrence'),
        q.status ? sql`${records.data}->>'status' = ${q.status}` : undefined,
        q.category
          ? sql`${records.data}->>'category' = ${q.category}`
          : undefined,
        q.userId ? eq(records.authorId, q.userId) : undefined,
      );
      const rows = await db
        .select()
        .from(records)
        .where(where)
        .orderBy(desc(records.createdAt), records.id)
        .limit(req.query.limit ?? 50)
        .offset(req.query.offset ?? 0);
      return ok(await Promise.all(rows.map((r) => present(r, req.user?.id))));
    });
    app.get<{ Params: { id: string } }>(`/api/${path}/:id`, async (req) =>
      ok(
        await present(
          await find(municipalityId(req), req.params.id, kind),
          req.user?.id,
        ),
      ),
    );
    app.delete<{ Params: { id: string } }>(`/api/${path}/:id`, async (req) => {
      await db.transaction(async (tx) => {
        const row = await find(
          municipalityId(req),
          req.params.id,
          kind,
          tx,
          true,
        );
        if (row.authorId !== req.user!.id)
          throw fail(403, 'Somente o autor pode excluir este registro.');
        if (!canDeleteRecord(row.data))
          throw fail(
            409,
            'Este registro já recebeu atendimento da prefeitura e não pode ser excluído.',
          );
        if (row.data.comments.length) {
          const responders = await tx
            .select({ id: users.id })
            .from(users)
            .where(
              and(
                inArray(
                  users.id,
                  row.data.comments.map((comment) => comment.userId),
                ),
                ne(users.role, 'citizen'),
              ),
            );
          if (responders.length)
            throw fail(
              409,
              'Este registro já recebeu uma resposta da prefeitura e não pode ser excluído.',
            );
        }
        const linked = await tx
          .select({ id: records.id })
          .from(records)
          .where(
            and(
              eq(records.municipalityId, row.municipalityId),
              ne(records.kind, 'occurrence'),
              ne(records.kind, 'proposal'),
              sql`${records.data}->'linkedIds' @> ${JSON.stringify([row.id])}::jsonb`,
            ),
          );
        if (linked.length)
          throw fail(
            409,
            'Este registro está vinculado a uma ação da prefeitura e não pode ser excluído.',
          );
        await tx.delete(records).where(eq(records.id, row.id));
      });
      return ok({ deleted: true });
    });
    app.put<{ Params: { id: string } }>(
      `/api/${path}/:id/view`,
      async (req) => {
        const value = await db.transaction(async (tx) => {
          const row = await find(
            municipalityId(req),
            req.params.id,
            kind,
            tx,
            true,
          );
          if (row.kind !== 'occurrence' && row.kind !== 'proposal')
            throw fail(
              400,
              'Visualizações disponíveis para ocorrências e propostas.',
            );
          await tx
            .insert(relations)
            .values({ recordId: row.id, userId: req.user!.id, kind: 'view' })
            .onConflictDoNothing();
          return present(row, req.user!.id, tx);
        });
        return ok(value);
      },
    );
    for (const relation of ['support', 'follow'] as const) {
      for (const method of ['PUT', 'DELETE'] as const) {
        app.route<{ Params: { id: string } }>({
          method,
          url: `/api/${path}/:id/${relation}`,
          handler: async (req) => {
            const value = await db.transaction(async (tx) => {
              const row = await find(
                municipalityId(req),
                req.params.id,
                kind,
                tx,
                true,
              );
              const match = and(
                eq(relations.recordId, row.id),
                eq(relations.userId, req.user!.id),
                eq(relations.kind, relation),
              );
              if (method === 'PUT')
                await tx
                  .insert(relations)
                  .values({
                    recordId: row.id,
                    userId: req.user!.id,
                    kind: relation,
                  })
                  .onConflictDoNothing();
              else await tx.delete(relations).where(match);
              return present(row, req.user!.id, tx);
            });
            return ok(value);
          },
        });
      }
    }
    app.post<{ Params: { id: string }; Body: { text: string } }>(
      `/api/${path}/:id/comments`,
      { schema: { body: object({ text: string(2000) }, ['text']) } },
      async (req) => {
        return ok(
          await db.transaction(async (tx) => {
            const row = await find(
              municipalityId(req),
              req.params.id,
              kind,
              tx,
              true,
            );
            row.data.comments.push({
              id: randomUUID(),
              text: req.body.text,
              userId: req.user!.id,
              userName: req.user!.name,
              createdAt: now(),
            });
            if (req.user!.role !== 'citizen')
              row.data.municipalInterventionAt ??= now();
            await tx
              .update(records)
              .set({ data: row.data })
              .where(eq(records.id, row.id));
            return present(row, req.user!.id, tx);
          }),
        );
      },
    );
    for (const method of ['PATCH', 'DELETE'] as const) {
      app.route<{
        Params: { id: string; commentId: string };
        Body: { text: string };
      }>({
        method,
        url: `/api/${path}/:id/comments/:commentId`,
        ...(method === 'PATCH'
          ? { schema: { body: object({ text: string(2000) }, ['text']) } }
          : {}),
        handler: async (req) => {
          const value = await db.transaction(async (tx) => {
            const row = await find(
              municipalityId(req),
              req.params.id,
              kind,
              tx,
              true,
            );
            const index = row.data.comments.findIndex(
              (comment) => comment.id === req.params.commentId,
            );
            if (index < 0) throw fail(404, 'Comentário não encontrado.');
            if (row.data.comments[index].userId !== req.user!.id)
              throw fail(403, 'Somente o autor pode alterar este comentário.');
            if (req.user!.role !== 'citizen')
              row.data.municipalInterventionAt ??= now();
            if (method === 'DELETE') row.data.comments.splice(index, 1);
            else {
              row.data.comments[index].text = req.body.text.trim();
              row.data.comments[index].editedAt = now();
            }
            await tx
              .update(records)
              .set({ data: row.data })
              .where(eq(records.id, row.id));
            return present(row, req.user!.id, tx);
          });
          return ok(value);
        },
      });
    }
  }
  app.post<{
    Body: {
      title: string;
      description: string;
      category: Occurrence['category'];
      location: Occurrence['location'];
      images?: string[];
      reportedImpact?: Occurrence['priority'];
    };
  }>(
    '/api/occurrences',
    {
      schema: {
        body: object(
          {
            title: string(120),
            description: string(),
            category,
            location,
            images: { ...images, minItems: 1 },
            reportedImpact: enumeration(['low', 'medium', 'high']),
          },
          ['title', 'description', 'category', 'location', 'images'],
        ),
      },
    },
    async (req) => {
      await validateImages(req, req.body.images);
      await territory.validatePoint(municipalityId(req), req.body.location);
      const at = now();
      const id = randomUUID();
      const value: Occurrence = {
        id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        location: req.body.location,
        images: req.body.images ?? [],
        status: 'pending',
        priority: 'medium',
        reportedBy: req.user!.id,
        reportedAt: at,
        votes: 0,
        comments: [],
        statusHistory: [
          {
            status: 'pending',
            at,
            source: 'citizen',
            justification: 'Registro recebido.',
            actor: req.user!.name,
          },
        ],
      };
      if (req.body.reportedImpact)
        value.reportedImpact = req.body.reportedImpact;
      const [row] = await db
        .insert(records)
        .values({
          id,
          municipalityId: municipalityId(req),
          kind: 'occurrence',
          authorId: req.user!.id,
          data: value,
        })
        .returning();
      return ok(await present(row, req.user!.id));
    },
  );
  app.post<{
    Params: { id: string };
    Body: {
      status: Occurrence['status'];
      justification: string;
      sector?: string;
      images?: string[];
      priority?: Occurrence['priority'];
    };
  }>(
    '/api/occurrences/:id/transitions',
    {
      schema: {
        body: object(
          {
            status,
            justification: string(2000),
            sector: string(120),
            images,
            priority: enumeration(['low', 'medium', 'high']),
          },
          ['status', 'justification'],
        ),
      },
    },
    async (req) => {
      const actor = staff(req);
      await validateImages(req, req.body.images);
      return ok(
        await db.transaction(async (tx) => {
          const row = await find(
            municipalityId(req),
            req.params.id,
            'occurrence',
            tx,
            true,
          );
          const value = row.data as Occurrence;
          const allowed = {
            pending: ['in_progress'],
            in_progress: ['pending', 'resolved'],
            resolved: ['in_progress'],
          };
          const triageChanged =
            (req.body.priority !== undefined &&
              req.body.priority !== value.priority) ||
            (req.body.sector !== undefined && req.body.sector !== value.sector);
          if (
            !allowed[value.status].includes(req.body.status) &&
            !(value.status === req.body.status && triageChanged)
          )
            throw fail(409, 'Transição de situação inválida.');
          if (req.body.priority) value.priority = req.body.priority;
          value.status = req.body.status;
          value.sector = req.body.sector ?? value.sector;
          value.statusHistory.push({
            status: value.status,
            at: now(),
            source: 'management',
            justification: req.body.justification,
            actor: actor.name,
            sector: value.sector,
          });
          if (value.status === 'resolved') value.resolvedAt = now();
          else {
            delete value.resolvedAt;
            delete value.evaluation;
          }
          value.images.push(...(req.body.images ?? []));
          await tx
            .update(records)
            .set({ data: value })
            .where(eq(records.id, row.id));
          return present(row, actor.id, tx);
        }),
      );
    },
  );
  app.post<{
    Params: { id: string };
    Body: { satisfied: boolean; reason: string; rating?: number };
  }>(
    '/api/occurrences/:id/evaluation',
    {
      schema: {
        body: object(
          {
            satisfied: { type: 'boolean' },
            reason: string(2000, 0),
            rating: { type: 'integer', minimum: 1, maximum: 5 },
          },
          ['satisfied', 'reason'],
        ),
      },
    },
    async (req) => {
      return ok(
        await db.transaction(async (tx) => {
          const row = await find(
            municipalityId(req),
            req.params.id,
            'occurrence',
            tx,
            true,
          );
          const value = row.data as Occurrence;
          if (row.authorId !== req.user!.id)
            throw fail(403, 'Apenas o autor pode avaliar.');
          if (value.status !== 'resolved')
            throw fail(409, 'A ocorrência ainda não foi concluída.');
          if (value.evaluation) throw fail(409, 'Avaliação já registrada.');
          if (
            !req.body.satisfied &&
            !req.body.rating &&
            !req.body.reason.trim()
          )
            throw fail(400, 'Informe o motivo da revisão.');
          value.evaluation = {
            ...req.body,
            ...(req.body.rating ? { satisfied: req.body.rating >= 3 } : {}),
            at: now(),
          };
          if (!req.body.satisfied && !req.body.rating)
            value.statusHistory.push({
              status: 'resolved',
              source: 'citizen',
              at: now(),
              justification: `Revisão solicitada pelo autor: ${req.body.reason}`,
              actor: req.user!.name,
            });
          await tx
            .update(records)
            .set({ data: value })
            .where(eq(records.id, row.id));
          return present(row, req.user!.id, tx);
        }),
      );
    },
  );
  const civicProperties = {
    kind: enumeration(['proposal', 'consultation', 'action']),
    title: string(120),
    summary: string(500),
    body: string(),
    images: { ...images, maxItems: 5 },
    neighborhood: string(120),
    territory: civicTerritory,
    responsible: string(120),
    linkedIds: { type: 'array', maxItems: 20, items: string(100) },
    closesAt: { type: 'string', format: 'date-time' },
    options: {
      type: 'array',
      minItems: 2,
      maxItems: 10,
      uniqueItems: true,
      items: string(200),
    },
    dueAt: { type: 'string', format: 'date-time' },
  };
  app.post<{
    Body: {
      kind: CivicItem['kind'];
      title: string;
      summary: string;
      body: string;
      images?: string[];
      neighborhood?: string;
      territory?: CivicTerritory;
      responsible?: string;
      linkedIds?: string[];
      closesAt?: string;
      options?: string[];
      dueAt?: string;
    };
  }>(
    '/api/civic-items',
    {
      schema: {
        body: {
          ...object(civicProperties, ['kind', 'title', 'summary', 'body']),
          anyOf: [{ required: ['neighborhood'] }, { required: ['territory'] }],
        },
      },
    },
    async (req) => {
      const b = req.body;
      if (b.kind !== 'proposal') staff(req);
      if (b.images !== undefined && b.kind !== 'proposal')
        throw fail(400, 'Fotos neste campo pertencem apenas a propostas.');
      await validateImages(req, b.images);
      const scope = await normalizeCivicTerritory(req, b.territory);
      for (const id of b.linkedIds ?? []) {
        const [linked] = await db
          .select({ id: records.id })
          .from(records)
          .where(
            and(
              eq(records.id, id),
              eq(records.municipalityId, municipalityId(req)),
            ),
          );
        if (!linked) throw fail(404, 'Registro vinculado não encontrado.');
      }
      const base = {
        municipalityId: municipalityId(req),
        id: randomUUID(),
        title: b.title,
        summary: b.summary,
        body: b.body,
        neighborhood: scope
          ? scope.scope === 'municipality'
            ? 'Todo o município'
            : scope.neighborhood
          : b.neighborhood!.trim(),
        ...(scope ? { territory: scope } : {}),
        createdBy: req.user!.id,
        createdAt: now(),
        responsible: b.responsible || 'Gestão municipal',
        comments: [],
        supports: 0,
        linkedIds: b.linkedIds ?? [],
      };
      let value: CivicItem;
      if (b.kind === 'proposal')
        value = {
          ...base,
          kind: 'proposal',
          status: 'submitted',
          images: b.images ?? [],
        };
      else if (b.kind === 'consultation') {
        if (!b.options || !b.closesAt || Date.parse(b.closesAt) <= Date.now())
          throw fail(400, 'Consulta exige opções e prazo futuro.');
        value = {
          ...base,
          kind: 'consultation',
          status: 'open',
          closesAt: b.closesAt,
          options: b.options,
          answerCounts: b.options.map(() => 0),
        };
      } else {
        if (!b.dueAt) throw fail(400, 'Ação exige prazo.');
        value = {
          ...base,
          kind: 'action',
          status: 'planned',
          progress: 0,
          dueAt: b.dueAt,
          evidence: [],
          updates: [],
        };
      }
      const [row] = await db
        .insert(records)
        .values({
          id: value.id,
          municipalityId: municipalityId(req),
          kind: value.kind,
          authorId: req.user!.id,
          data: value,
        })
        .returning();
      return ok(await present(row, req.user!.id));
    },
  );
  app.patch<{
    Params: { id: string };
    Body: {
      status?: string;
      decision?: string;
      result?: string;
      responsible?: string;
      progress?: number;
      evidence?: string[];
      update?: string;
      dueAt?: string;
      justification?: string;
      territory?: CivicTerritory;
    };
  }>(
    '/api/civic-items/:id',
    {
      schema: {
        body: object({
          status: enumeration([
            'submitted',
            'under_review',
            'accepted',
            'declined',
            'open',
            'closed',
            'planned',
            'in_progress',
            'completed',
          ]),
          decision: string(3000),
          result: string(3000),
          responsible: string(120),
          progress: { type: 'integer', minimum: 0, maximum: 100 },
          evidence: images,
          update: string(3000),
          justification: string(3000),
          territory: civicTerritory,
          dueAt: { type: 'string', format: 'date-time' },
        }),
      },
    },
    async (req) => {
      const actor = staff(req);
      await validateImages(req, req.body.evidence);
      // Validate before taking a record transaction connection; the user mutation
      // lock already pins the session municipality throughout this request.
      const scope = await normalizeCivicTerritory(req, req.body.territory);
      return ok(
        await db.transaction(async (tx) => {
          const row = await find(
            municipalityId(req),
            req.params.id,
            'civic',
            tx,
            true,
          );
          const value = row.data as CivicItem;
          const b = req.body;
          applyCivicUpdate(
            value,
            { ...b, ...(scope ? { territory: scope } : {}) },
            actor.name,
          );
          await tx
            .update(records)
            .set({ data: value })
            .where(eq(records.id, row.id));
          return present(row, actor.id, tx);
        }),
      );
    },
  );
  app.put<{ Params: { id: string }; Body: { option: number } }>(
    '/api/civic-items/:id/answer',
    {
      schema: {
        body: object({ option: { type: 'integer', minimum: 0, maximum: 9 } }, [
          'option',
        ]),
      },
    },
    async (req) => {
      return ok(
        await db.transaction(async (tx) => {
          const row = await find(
            municipalityId(req),
            req.params.id,
            'civic',
            tx,
            true,
          );
          const value = row.data as CivicItem;
          if (value.kind !== 'consultation')
            throw fail(400, 'Este registro não é uma consulta.');
          if (
            value.status !== 'open' ||
            Date.parse(value.closesAt) <= Date.now()
          )
            throw fail(409, 'Consulta encerrada.');
          if (req.body.option >= value.options.length)
            throw fail(400, 'Opção inválida.');
          await tx
            .insert(answers)
            .values({
              recordId: row.id,
              userId: req.user!.id,
              option: req.body.option,
            })
            .onConflictDoUpdate({
              target: [answers.recordId, answers.userId],
              set: { option: req.body.option },
            });
          return present(row, req.user!.id, tx);
        }),
      );
    },
  );
  for (const [path, kind] of [
    ['occurrences', 'occurrence'],
    ['civic-items', 'civic'],
  ] as const) {
    app.get<{ Params: { id: string } }>(
      `/api/activity/${path}/:id`,
      async (req) => {
        if (!req.user) throw fail(401, 'Entre para acompanhar.');
        const uid = req.user.id;
        const [row] = await db
          .select()
          .from(records)
          .where(
            and(
              eq(records.id, req.params.id),
              kind === 'occurrence'
                ? eq(records.kind, 'occurrence')
                : ne(records.kind, 'occurrence'),
            ),
          );
        if (!row) throw fail(404, 'Registro não encontrado.');
        if (row.authorId !== uid) {
          const [relation] = await db
            .select({ id: relations.recordId })
            .from(relations)
            .where(
              and(
                eq(relations.recordId, row.id),
                eq(relations.userId, uid),
                sql`${relations.kind} IN ('support', 'follow')`,
              ),
            )
            .limit(1);
          const [answer] = await db
            .select({ id: answers.recordId })
            .from(answers)
            .where(and(eq(answers.recordId, row.id), eq(answers.userId, uid)))
            .limit(1);
          if (!relation && !answer) throw fail(404, 'Registro não encontrado.');
        }
        return ok(await present(row, uid));
      },
    );
  }
  app.get('/api/activity', async (req) => {
    if (!req.user) throw fail(401, 'Entre para acompanhar.');
    const relevant = await db
      .select({ id: relations.recordId })
      .from(relations)
      .where(
        and(
          eq(relations.userId, req.user.id),
          sql`${relations.kind} IN ('support', 'follow')`,
        ),
      );
    const responded = await db
      .select({ id: answers.recordId })
      .from(answers)
      .where(eq(answers.userId, req.user.id));
    const ids = new Set([...relevant, ...responded].map((x) => x.id));
    const rows = await db
      .select()
      .from(records)
      .orderBy(desc(records.createdAt));
    const values = await Promise.all(
      rows
        .filter((r) => r.authorId === req.user!.id || ids.has(r.id))
        .slice(0, 500)
        .map((r) => present(r, req.user!.id)),
    );
    return ok({
      occurrences: values.filter((v) => !('kind' in v)),
      items: values.filter((v) => 'kind' in v),
    });
  });
  app.get('/api/overview', async (req) => {
    const rows = await db
      .select()
      .from(records)
      .where(eq(records.municipalityId, municipalityId(req)));
    return ok(summarizeOverview(rows.map((row) => row.data)));
  });
  app.get<{
    Querystring: {
      description?: string;
      latitude?: number;
      longitude?: number;
      category?: Occurrence['category'];
    };
  }>(
    '/api/duplicates',
    {
      schema: {
        querystring: object({
          description: string(5000, 0),
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 },
          category,
        }),
      },
    },
    async (req) => {
      const rows = await db
        .select()
        .from(records)
        .where(
          and(
            eq(records.kind, 'occurrence'),
            eq(records.municipalityId, municipalityId(req)),
          ),
        );
      const q = req.query;
      const words = (q.description || '')
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3);
      const matches = rows
        .filter((row) => {
          const v = row.data as Occurrence;
          if (q.category && v.category !== q.category) return false;
          if (v.status === 'resolved') return false;
          if (q.latitude !== undefined && q.longitude !== undefined) {
            const dlat = ((v.location.latitude - q.latitude) * Math.PI) / 180;
            const dlon = ((v.location.longitude - q.longitude) * Math.PI) / 180;
            const a =
              Math.sin(dlat / 2) ** 2 +
              Math.cos((q.latitude * Math.PI) / 180) *
                Math.cos((v.location.latitude * Math.PI) / 180) *
                Math.sin(dlon / 2) ** 2;
            return (
              6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) < 300
            );
          }
          return words.some((w) =>
            (v.title + ' ' + v.description).toLowerCase().includes(w),
          );
        })
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, 10);
      return ok(
        await Promise.all(matches.map((r) => present(r, req.user?.id))),
      );
    },
  );
  app.post(
    '/api/attachments',
    { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req) => {
      // Multipart is consumed inside the handler, unlike JSON bodies. Aborting
      // its stream must reject the read so the handler's lock finally can run.
      let part: Awaited<ReturnType<typeof req.file>>;
      let abortRead: () => void = () => {};
      const aborted = new Promise<never>((_resolve, reject) => {
        abortRead = () => {
          part?.file.destroy();
          reject(fail(499, 'Upload aborted.'));
        };
        req.raw.once('aborted', abortRead);
      });
      let buffer: Buffer;
      try {
        buffer = await Promise.race([
          (async () => {
            part = await req.file();
            if (!part) throw fail(400, 'Selecione uma imagem.');
            return part.toBuffer();
          })(),
          aborted,
        ]);
        if (req.raw.aborted || req.raw.socket.destroyed)
          throw fail(499, 'Upload aborted.');
      } finally {
        req.raw.off('aborted', abortRead);
      }
      if (!part) throw fail(400, 'Selecione uma imagem.');
      const mime = buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
        ? 'image/jpeg'
        : buffer
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          ? 'image/png'
          : buffer.subarray(0, 4).toString() === 'RIFF' &&
              buffer.subarray(8, 12).toString() === 'WEBP'
            ? 'image/webp'
            : null;
      if (!mime || part.mimetype !== mime)
        throw fail(400, 'Use uma imagem JPEG, PNG ou WebP válida.');
      let sanitized: Buffer;
      try {
        sanitized = await sharp(buffer, {
          limitInputPixels: 16000000,
          failOn: 'error',
        })
          .rotate()
          .resize({ width: 2048, withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
      } catch {
        throw fail(
          400,
          'A imagem está corrompida ou excede o tamanho permitido.',
        );
      }
      const id = randomUUID();
      await mkdir(uploadDir, { recursive: true });
      await writeFile(resolve(uploadDir, id), sanitized, { flag: 'wx' });
      try {
        await db.insert(attachments).values({
          id,
          municipalityId: municipalityId(req),
          mime: 'image/webp',
          ownerId: req.user!.id,
        });
      } catch (error) {
        await unlink(resolve(uploadDir, id));
        throw error;
      }
      return ok({ url: `/api/attachments/${id}` });
    },
  );
  app.get<{ Params: { name: string } }>(
    '/api/demo-media/:name',
    async (req, reply) => {
      if (
        ![
          'lighting.jpg',
          'benches.jpg',
          'sidewalk.jpg',
          'avatar-ana.jpg',
          'avatar-gestao.jpg',
          'avatar-admin.jpg',
          'road.jpg',
          'waste.jpg',
          'crossing.jpg',
          'gloria-dark.jpg',
          'legacy-light-1.jpg',
          'legacy-light-2.jpg',
          'legacy-light-3.jpg',
          'legacy-light-4.jpg',
          'gloria-light.jpg',
          'recycling.jpg',
          'park-path.jpg',
          'park-shade.jpg',
          'crossing-day.jpg',
          'accessible-path.jpg',
        ].includes(req.params.name)
      )
        throw fail(404, 'Imagem de exemplo não encontrada.');
      try {
        return reply
          .type('image/jpeg')
          .header('X-Content-Type-Options', 'nosniff')
          .header('Cache-Control', 'public, max-age=86400')
          .send(await readFile(resolve('data/demo-media', req.params.name)));
      } catch {
        throw fail(404, 'Imagem de exemplo não encontrada.');
      }
    },
  );
  app.get<{ Params: { id: string } }>(
    '/api/attachments/:id',
    async (req, reply) => {
      if (!/^[a-f0-9-]{36}$/.test(req.params.id))
        throw fail(404, 'Anexo não encontrado.');
      const [row] = await db
        .select()
        .from(attachments)
        .where(eq(attachments.id, req.params.id));
      if (!row) throw fail(404, 'Anexo não encontrado.');
      try {
        return reply
          .type(row.mime)
          .header('X-Content-Type-Options', 'nosniff')
          .header('Cache-Control', 'public, max-age=86400')
          .send(await readFile(resolve(uploadDir, row.id)));
      } catch {
        throw fail(404, 'Anexo não encontrado.');
      }
    },
  );
  app.post<{ Body: { description: string; imageUrl?: string } }>(
    '/api/analysis',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
      schema: {
        body: object({ description: string(5000, 0), imageUrl: images.items }, [
          'description',
        ]),
      },
    },
    async (req) => {
      if (!req.body.description.trim() && !req.body.imageUrl)
        throw fail(400, 'Adicione uma foto ou descreva o problema.');
      let image: { data: string; mimeType: string } | undefined;
      if (req.body.imageUrl) {
        await validateImages(req, [req.body.imageUrl]);
        const id = req.body.imageUrl.split('/').at(-1)!;
        let bytes: Buffer;
        try {
          bytes = await readFile(resolve(uploadDir, id));
        } catch {
          throw fail(410, 'A foto não está disponível. Anexe novamente.');
        }
        image = { data: bytes.toString('base64'), mimeType: 'image/webp' };
      }
      return ok(
        await analyze(
          { description: req.body.description, image },
          process.env.GEMINI_API_KEY,
        ),
      );
    },
  );
  app.post<{ Body: { scenario: 'registered' | 'in_progress' | 'resolved' } }>(
    '/api/presentation/reset',
    {
      schema: {
        body: object(
          { scenario: enumeration(['registered', 'in_progress', 'resolved']) },
          ['scenario'],
        ),
      },
    },
    async (req) => {
      if (req.user?.role !== 'admin')
        throw fail(
          403,
          'Apenas administradores podem restaurar a apresentação.',
        );
      if (municipalityId(req) !== '3304557')
        throw fail(
          409,
          'Cenarios de apresentacao disponiveis apenas para Rio de Janeiro.',
        );
      const previous = await db
        .select({ id: attachments.id })
        .from(attachments)
        .where(eq(attachments.municipalityId, municipalityId(req)));
      await seed(db, true, req.body.scenario, municipalityId(req));
      await Promise.allSettled(
        previous.map((file) => unlink(resolve(uploadDir, file.id))),
      );
      return ok({ scenario: req.body.scenario });
    },
  );
  return app;
}
