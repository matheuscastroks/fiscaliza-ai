import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { SessionUser } from '../../shared/contracts.js';
import {
  createLoginThrottle,
  hashPassword,
  needsRehash,
  newToken,
  spendPasswordTime,
  tokenHash,
  verifyPassword,
} from './auth.js';
import {
  registrationError,
  type RegistrationInput,
} from '../../shared/registration.js';
import type { Database } from './db.js';
import type { municipalityService } from './municipality.js';
import {
  attachmentId,
  removeAttachments,
  removeUploadFiles,
} from './attachments-routes.js';
import { attachments, sessions, users } from './schema.js';

export function registerAuthRoutes(
  app: FastifyInstance,
  options: {
    db: Database;
    territory: ReturnType<typeof municipalityService>;
    ok: (data: unknown) => unknown;
    fail: (statusCode: number, message: string) => Error;
    hydrate: (u: typeof users.$inferSelect) => Promise<SessionUser>;
    production: boolean;
    uploadDir: string;
    sessionCookie: (req: FastifyRequest) => string;
    validateImages: (
      req: FastifyRequest,
      values: string[] | undefined,
    ) => Promise<void>;
    schema: {
      string: (max?: number, min?: number) => Record<string, unknown>;
      object: (
        properties: Record<string, unknown>,
        required?: string[],
      ) => Record<string, unknown>;
      images: {
        type: string;
        maxItems: number;
        items: Record<string, unknown>;
      };
    };
  },
) {
  const {
    db,
    territory,
    ok,
    fail,
    hydrate,
    production,
    uploadDir,
    sessionCookie,
    validateImages,
    schema,
  } = options;

  const loginThrottle = createLoginThrottle();

  function setSessionCookie(
    req: FastifyRequest,
    reply: FastifyReply,
    token: string,
  ) {
    reply.setCookie(sessionCookie(req), token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: production,
      path: '/api',
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  app.post<{ Body: RegistrationInput }>(
    '/api/auth/register',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
      schema: {
        body: schema.object(
          {
            name: schema.string(100, 2),
            email: schema.string(254),
            password: schema.string(128, 8),
          },
          ['name', 'email', 'password'],
        ),
      },
    },
    async (req, reply) => {
      const error = registrationError(req.body);
      if (error) throw fail(400, error);
      const passwordHash = await hashPassword(req.body.password);
      const token = newToken();
      const user = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(users)
          .values({
            id: randomUUID(),
            name: req.body.name.trim(),
            email: req.body.email.trim().toLowerCase(),
            passwordHash,
            role: 'citizen',
          })
          .onConflictDoNothing({ target: users.email })
          .returning();
        if (!created)
          throw fail(
            409,
            'Este e-mail já possui uma conta. Entre com sua senha.',
          );
        await tx.insert(sessions).values({
          tokenHash: tokenHash(token),
          userId: created.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        return created;
      });
      setSessionCookie(req, reply, token);
      reply.code(201);
      return ok({ user: await hydrate(user), token });
    },
  );

  app.post<{ Body: { email: string; password: string } }>(
    '/api/auth/login',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
      schema: {
        body: schema.object(
          {
            email: schema.string(254),
            password: schema.string(256),
          },
          ['email', 'password'],
        ),
      },
    },
    async (req, reply) => {
      const email = req.body.email.toLowerCase().trim();
      if (loginThrottle.blocked(email))
        throw fail(429, 'Muitas tentativas. Tente de novo em alguns minutos.');
      const [u] = await db.select().from(users).where(eq(users.email, email));
      if (!u) {
        // Mesmo custo de um login real: o tempo não revela se a conta existe.
        await spendPasswordTime(req.body.password);
        loginThrottle.fail(email);
        throw fail(401, 'E-mail ou senha inválidos.');
      }
      if (!(await verifyPassword(req.body.password, u.passwordHash))) {
        loginThrottle.fail(email);
        throw fail(401, 'E-mail ou senha inválidos.');
      }
      loginThrottle.reset(email);
      // Conta com hash do custo antigo: regrava no custo atual.
      if (needsRehash(u.passwordHash))
        await db
          .update(users)
          .set({ passwordHash: await hashPassword(req.body.password) })
          .where(eq(users.id, u.id));
      const token = newToken();
      await db.insert(sessions).values({
        tokenHash: tokenHash(token),
        userId: u.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      setSessionCookie(req, reply, token);
      return ok({ user: await hydrate(u), token });
    },
  );

  app.get('/api/auth/me', async (req) => {
    if (!req.user) throw fail(401, 'Sessão expirada.');
    return ok(req.user);
  });

  app.put<{ Body: { avatar: string } }>(
    '/api/profile/avatar',
    {
      schema: {
        body: schema.object({ avatar: schema.images.items }, ['avatar']),
      },
    },
    async (req) => {
      await validateImages(req, [req.body.avatar]);
      const previous = attachmentId(req.user!.avatar);
      const [updated] = await db
        .update(users)
        .set({ avatar: req.body.avatar })
        .where(eq(users.id, req.user!.id))
        .returning();
      // A foto anterior deixa de existir (um avatar por usuário).
      if (previous && previous !== attachmentId(req.body.avatar))
        await removeAttachments(db, uploadDir, req.user!.id, [previous]);
      return ok(await hydrate(updated));
    },
  );

  const deleteProfile = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) throw fail(401, 'Entre para continuar.');
    const owned = await db
      .select({ id: attachments.id })
      .from(attachments)
      .where(eq(attachments.ownerId, req.user.id));
    await db.delete(users).where(eq(users.id, req.user.id));
    // As linhas saíram com a conta (ON DELETE CASCADE); agora os arquivos.
    await removeUploadFiles(
      uploadDir,
      owned.map((row) => row.id),
    );
    if (req.sessionToken)
      await db
        .delete(sessions)
        .where(eq(sessions.tokenHash, tokenHash(req.sessionToken)));
    reply.clearCookie(sessionCookie(req), { path: '/api' });
    return ok(null);
  };
  app.delete('/api/auth/profile', deleteProfile);
  app.delete('/api/profile', deleteProfile);

  app.post('/api/auth/logout', async (req, reply) => {
    if (req.sessionToken)
      await db
        .delete(sessions)
        .where(eq(sessions.tokenHash, tokenHash(req.sessionToken)));
    reply.clearCookie(sessionCookie(req), { path: '/api' });
    return ok(null);
  });

  // Encerra a sessão em todos os aparelhos da conta.
  app.post('/api/auth/logout-all', async (req, reply) => {
    if (!req.user) throw fail(401, 'Entre para continuar.');
    await db.delete(sessions).where(eq(sessions.userId, req.user.id));
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
        body: schema.object(
          {
            postalCode: schema.string(9),
            municipalityId: { type: 'string', pattern: '^[0-9]{7}$' },
          },
          ['postalCode', 'municipalityId'],
        ),
      },
    },
    async (req) => {
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
}
