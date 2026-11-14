import { HEALTH_SOURCE_IDS, registerDeepHealthRoute } from './deep-health.js';
import { randomUUID } from 'node:crypto';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import { and, eq, gt } from 'drizzle-orm';
import Fastify, { type FastifyRequest } from 'fastify';
import { resolve } from 'node:path';
import type { SessionUser } from '../../shared/contracts.js';
import { SESSION_RENEW_BELOW_MS, sessionExpiry, tokenHash } from './auth.js';
import { loadConfig } from './config.js';
import { database } from './db.js';
import { rateLimitKey } from './client-ip.js';
import { createKeyedLock } from './keyed-lock.js';
import { httpError as fail, ok } from './http-errors.js';
import { reportError } from './monitoring.js';
import { createResponseCache } from './response-cache.js';
import { municipalityService } from './municipality.js';
import { attachments, municipalities, sessions, users } from './schema.js';
import { registerOfficialCallsRoutes } from './official-calls.js';
import { registerPublicDataRoutes } from './public-data.js';
import { registerAuthRoutes } from './auth-routes.js';
import { registerAttachmentsRoutes } from './attachments-routes.js';
import { registerNotificationRoutes } from './notifications.js';
import { registerSavedCallsRoutes } from './saved-calls.js';

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
// Um nome só de cookie de sessão (o painel municipal, que usava outro, não existe mais).
const sessionCookie = (_req?: FastifyRequest) => 'citizen_session';
const isAccountPath = (path: string) =>
  path.startsWith('/api/auth/') ||
  path === '/api/profile' ||
  path.startsWith('/api/profile/');
const publicUser = (u: typeof users.$inferSelect): SessionUser => ({
  id: u.id,
  name: u.name,
  avatar: u.avatar ?? undefined,
  email: u.email,
  role: 'citizen',
  postalCode: u.postalCode ?? undefined,
  neighborhood: u.neighborhood ?? undefined,
  municipality: null,
});

export async function buildApp(
  options: {
    databaseUrl?: string;
    logger?: boolean;
    fetch?: typeof fetch;
  } = {},
) {
  const config = loadConfig(process.env, { databaseUrl: options.databaseUrl });
  const app = Fastify({
    logger: options.logger ? { serializers: {
      req: (req) => ({ method: req.method, url: req.url?.split('?')[0], hostname: req.hostname, remoteAddress: req.ip }),
    } } : false,
    trustProxy: config.trustProxy,
    // O id da requisição é o cf-ray da Cloudflare, quando houver: o mesmo valor
    // aparece no painel da Cloudflare e nos logs da API.
    requestIdHeader: 'cf-ray',
    genReqId: () => randomUUID(),
    bodyLimit: 1024 * 1024,
    requestTimeout: 30_000,
    connectionTimeout: 60_000,
    ajv: { customOptions: { removeAdditional: false } },
  });
  const connection = database(config.databaseUrl, {
    statementTimeoutMs: 10_000,
    lockTimeoutMs: 5_000,
    idleInTransactionTimeoutMs: 15_000,
  });
  const db = connection.db;
  const territory = municipalityService(db, options.fetch);
  const userLock = createKeyedLock(10_000);
  const cache = createResponseCache();

  async function hydrate(u: typeof users.$inferSelect): Promise<SessionUser> {
    const result = publicUser(u);
    if (u.municipalityId) {
      const [m] = await db
        .select({ data: municipalities.data })
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

  const origins = config.webOrigins;

  const isAllowedOrigin = (origin: string): boolean => {
    if (origins.includes(origin)) return true;
    if (!config.production) {
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

  const uploadDir = resolve(config.uploadDir);

  app.addHook('onClose', async () => {
    await connection.pool.end();
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
  // API JSON: sem HSTS (o HTTPS é da Cloudflare) e sem conteúdo ativo.
  await app.register(helmet, {
    hsts: false,
    contentSecurityPolicy: {
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
    },
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
  const clientKey = rateLimitKey(config.trustProxy);
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    // Depois da sessão: com conta, o limite é por pessoa; sem conta, por IP.
    // Operadoras móveis põem muitos aparelhos atrás do mesmo IP (CGNAT).
    hook: 'preHandler',
    keyGenerator: (req) => (req.user ? `user:${req.user.id}` : clientKey(req)),
    errorResponseBuilder: () =>
      fail(429, 'Muitas requisições em pouco tempo. Aguarde um momento e tente de novo.'),
  });

  app.decorateRequest('user', null);
  app.decorateRequest('sessionToken', null);

  // Escritas de um mesmo usuário rodam uma de cada vez. A fila fica na memória
  // (sem segurar conexão do banco) e as rotas de upload ficam de fora, para um
  // envio lento não travar as outras escritas da conta.
  app.addHook('onRoute', (route) => {
    const handler = route.handler;
    const serialize =
      (route.config as { userLock?: boolean } | undefined)?.userLock !== false;
    route.handler = async function (req, reply) {
      if (!req.user || ['GET', 'HEAD', 'OPTIONS'].includes(req.method))
        return handler.call(this, req, reply);
      const userId = req.user.id;
      const run = async () => {
        if (req.raw.aborted || req.raw.socket.destroyed)
          throw fail(499, 'Request aborted.');
        const [fresh] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));
        if (!fresh) throw fail(401, 'Sessao expirada.');
        req.user = await hydrate(fresh);
        if (!isAccountPath(req.url.split('?')[0])) municipalityId(req);
        if (req.raw.aborted || req.raw.socket.destroyed)
          throw fail(499, 'Request aborted.');
        return await handler.call(this, req, reply);
      };
      if (!serialize) return run();
      return userLock(userId, run, () =>
        fail(503, 'Há outra operação em andamento. Tente de novo.'),
      );
    };
  });

  app.setErrorHandler((caught, request, reply) => {
    const error: Error & { statusCode?: number; validation?: unknown[] } =
      caught instanceof Error ? caught : new Error('Erro desconhecido.');
    const statusCode =
      error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    if (statusCode >= 500) {
      request.log.error({ err: error, statusCode }, 'Erro interno ao atender requisição.');
      reportError(error, { route: request.routeOptions.url, method: request.method, reqId: request.id });
    }
    // Mensagens do validador e do limite de requisições vêm em inglês e com
    // detalhes internos: o app mostra uma frase em português.
    const message =
      statusCode >= 500
        ? 'Não foi possível concluir a operação.'
        : error.validation
          ? 'Dados inválidos na requisição. Confira os campos e tente de novo.'
          : error.message;
    reply.code(statusCode).send({ success: false, error: message });
  });

  // Dados públicos mudam no ritmo das sincronizações: um minuto de cache no
  // aparelho e na borda, com renovação em segundo plano.
  const publicReads = [
    /^\/api\/rio1746\/(calls|overview|filters)/,
    /^\/api\/public-facilities/,
    /^\/api\/territorial-boundaries/,
    /^\/api\/neighborhoods/,
  ];
  app.addHook('onSend', async (req, reply, payload) => {
    if (
      req.method === 'GET' &&
      reply.statusCode === 200 &&
      !reply.hasHeader('cache-control') &&
      publicReads.some((pattern) => pattern.test(req.url.split('?')[0]))
    )
      reply.header(
        'Cache-Control',
        'public, max-age=60, stale-while-revalidate=300',
      );
    return payload;
  });

  app.setNotFoundHandler((_req, reply) =>
    reply.code(404).send({ success: false, error: 'Recurso não encontrado.' }),
  );

  app.addHook('onRequest', async (req, reply) => {
    if (!req.url.startsWith('/api/')) return;
    const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    const bearer = req.headers.authorization?.match(
      /^Bearer ([A-Za-z0-9_-]+)$/,
    )?.[1];
    const path = req.url.split('?')[0];
    const isLogin = path === '/api/auth/login';
    const isRegistration = path === '/api/auth/register';
    // Sair com a sessão já vencida precisa funcionar para limpar o cookie.
    const isLogout = path === '/api/auth/logout';
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
        .select({ user: users, expiresAt: sessions.expiresAt })
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
        // Sessão em uso não vence: quando passa da metade, ganha mais 7 dias.
        if (row.expiresAt.getTime() - Date.now() < SESSION_RENEW_BELOW_MS) {
          const expiresAt = sessionExpiry();
          await db
            .update(sessions)
            .set({ expiresAt })
            .where(eq(sessions.tokenHash, tokenHash(token)));
          if (!bearer)
            reply.setCookie(sessionCookie(req), token, {
              httpOnly: true,
              sameSite: 'lax',
              secure: config.production,
              path: '/api',
              expires: expiresAt,
            });
        }
      }
    }
    if (mutation && !isLogin && !isRegistration && !isLogout && !req.user)
      throw fail(401, 'Entre para continuar.');
    if (
      !isAccountPath(path) &&
      path !== '/api/health' &&
      path !== '/api/health/deep' &&
      !(req.method === 'GET' && path.startsWith('/api/rio1746/')) &&
      !(
        req.method === 'GET' &&
        [
          '/api/data-sources',
          '/api/public-facilities',
          '/api/territorial-boundaries',
          '/api/neighborhoods',
          '/api/territory/resolve',
        ].some((base) => path === base || path.startsWith(base + '/'))
      ) &&
      !(
        req.method === 'GET' &&
        path.startsWith('/api/attachments/')
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

  // Vida do processo (sem banco); /api/health também confere o banco.
  app.get('/health', async () => ok({ status: 'ok' }));
  app.get('/api/health', async () => {
    await connection.pool.query('SELECT 1');
    return ok({ status: 'ok' });
  });

  registerDeepHealthRoute(app, async () => {
    const result = await connection.pool.query<{ sourceId: string; finishedAt: Date | null }>(
      'SELECT source_id AS "sourceId", MAX(finished_at) AS "finishedAt" FROM source_sync_runs WHERE source_id = ANY($1::text[]) AND status = $2 GROUP BY source_id',
      [HEALTH_SOURCE_IDS, 'success'],
    );
    return result.rows;
  });

  registerAuthRoutes(app, {
    db,
    territory,
    ok,
    fail,
    hydrate,
    production: config.production,
    uploadDir,
    sessionCookie,
    clientKey,
    validateImages,
    schema: { string, object, images },
  });

  registerOfficialCallsRoutes(app, db, ok, fail, cache);
  registerPublicDataRoutes(app, db, cache);


  registerAttachmentsRoutes(app, {
    db,
    uploadDir,
    ok,
    fail,
    municipalityId,
  });

  registerNotificationRoutes(app, {
    db,
  });
  registerSavedCallsRoutes(app, db);

  return app;
}
