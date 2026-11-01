import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import { and, eq, gt } from 'drizzle-orm';
import Fastify, { type FastifyRequest } from 'fastify';
import { resolve } from 'node:path';
import pg from 'pg';
import type { SessionUser } from '../../shared/contracts.js';
import { tokenHash } from './auth.js';
import { database } from './db.js';
import { municipalityService } from './municipality.js';
import { attachments, municipalities, sessions, users } from './schema.js';
import { registerOfficialCallsRoutes } from './official-calls.js';
import { registerPublicDataRoutes } from './public-data.js';
import { registerAuthRoutes } from './auth-routes.js';
import { registerAttachmentsRoutes } from './attachments-routes.js';
import { registerCivicRoutes } from './civic-routes.js';

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
const object = (
  properties: Record<string, unknown>,
  required: string[] = [],
) => ({ type: 'object', properties, required, additionalProperties: false });
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
      if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin))
        return true;
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
        [
          '/api/data-sources',
          '/api/public-facilities',
          '/api/territorial-boundaries',
          '/api/neighborhoods',
        ].some((base) => path === base || path.startsWith(base + '/'))
      ) &&
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

  app.get('/health', async () => ok({ status: 'ok' }));
  app.get('/api/health', async () => {
    await connection.pool.query('SELECT 1');
    return ok({ status: 'ok' });
  });

  registerAuthRoutes(app, {
    db,
    territory,
    ok,
    fail,
    hydrate,
    sessionCookie,
    validateImages,
    schema: { string, object, images },
  });

  registerOfficialCallsRoutes(app, db, connection.pool, ok, fail);
  registerPublicDataRoutes(app, db);

  registerCivicRoutes(app, {
    db,
    territory,
    uploadDir,
    ok,
    fail,
    municipalityId,
    now,
    validateImages,
  });

  registerAttachmentsRoutes(app, {
    db,
    uploadDir,
    ok,
    fail,
    municipalityId,
  });

  return app;
}
