import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { SessionUser } from '../../shared/contracts.js';
import {
  createLoginThrottle,
  hashPassword,
  needsRehash,
  newToken,
  SESSION_MS,
  sessionExpiry,
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
import { attachments, sessions, userPushTokens, users } from './schema.js';

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
    /** IP do cliente (o real, quando a conexão vem do túnel). */
    clientKey: (req: FastifyRequest) => string;
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
    clientKey,
    validateImages,
    schema,
  } = options;

  // Falhas por (e-mail, IP): errar a senha de propósito não bloqueia o dono da
  // conta em outra rede. O limite por e-mail, bem mais alto, freia tentativas
  // distribuídas por muitos IPs.
  const loginThrottle = createLoginThrottle(10);
  const accountThrottle = createLoginThrottle(100);
  const throttleKeys = (req: FastifyRequest, email: string) =>
    [`${email}|${clientKey(req)}`, email] as const;

  /**
   * O app nativo guarda o token no armazenamento seguro e o envia como Bearer;
   * o navegador recebe só o cookie httpOnly. O token nunca vai aos dois: no
   * corpo de uma resposta ao navegador, um script injetado poderia lê-lo.
   */
  function issueSession(req: FastifyRequest, reply: FastifyReply, token: string) {
    if (req.headers['x-fiscaliza-client'] === 'citizen-native') return { token };
    reply.setCookie(sessionCookie(req), token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: production,
      path: '/api',
      maxAge: SESSION_MS / 1000,
    });
    return {};
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
          expiresAt: sessionExpiry(),
        });
        return created;
      });
      const session = issueSession(req, reply, token);
      reply.code(201);
      return ok({ user: await hydrate(user), ...session });
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
      const [pairKey, emailKey] = throttleKeys(req, email);
      if (loginThrottle.blocked(pairKey) || accountThrottle.blocked(emailKey))
        throw fail(429, 'Muitas tentativas. Tente de novo em alguns minutos.');
      const failed = () => {
        loginThrottle.fail(pairKey);
        accountThrottle.fail(emailKey);
        return fail(401, 'E-mail ou senha inválidos.');
      };
      const [u] = await db.select().from(users).where(eq(users.email, email));
      if (!u) {
        // Mesmo custo de um login real: o tempo não revela se a conta existe.
        await spendPasswordTime(req.body.password);
        throw failed();
      }
      if (!(await verifyPassword(req.body.password, u.passwordHash))) throw failed();
      loginThrottle.reset(pairKey);
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
        expiresAt: sessionExpiry(),
      });
      return ok({ user: await hydrate(u), ...issueSession(req, reply, token) });
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

  // Apagar a conta é definitivo: pede a senha de novo, para um token vazado
  // (ou um aparelho emprestado) não bastar.
  const deleteProfile = async (
    req: FastifyRequest<{ Body: { password?: string } }>,
    reply: FastifyReply,
  ) => {
    if (!req.user) throw fail(401, 'Entre para continuar.');
    const [account] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, req.user.id));
    if (
      !account ||
      !req.body?.password ||
      !(await verifyPassword(req.body.password, account.passwordHash))
    )
      throw fail(403, 'Senha incorreta. A conta não foi apagada.');
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
  app.delete<{ Body: { password?: string } }>(
    '/api/auth/profile',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
      schema: { body: schema.object({ password: schema.string(256) }, ['password']) },
    },
    deleteProfile,
  );

  app.post('/api/auth/logout', async (req, reply) => {
    if (req.sessionToken)
      await db
        .delete(sessions)
        .where(eq(sessions.tokenHash, tokenHash(req.sessionToken)));
    reply.clearCookie(sessionCookie(req), { path: '/api' });
    return ok(null);
  });

  // Encerra a sessão em todos os aparelhos da conta. Nenhum deles continua
  // recebendo avisos: os tokens de push da conta saem junto.
  app.post('/api/auth/logout-all', async (req, reply) => {
    if (!req.user) throw fail(401, 'Entre para continuar.');
    await db.delete(sessions).where(eq(sessions.userId, req.user.id));
    await db.delete(userPushTokens).where(eq(userPushTokens.userId, req.user.id));
    reply.clearCookie(sessionCookie(req), { path: '/api' });
    return ok(null);
  });

  app.get<{ Params: { cep: string } }>(
    '/api/profile/postal-code/:cep',
    {
      schema: {
        params: schema.object({ cep: { type: 'string', pattern: '^[0-9]{5}-?[0-9]{3}$' } }, ['cep']),
      },
    },
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

}
