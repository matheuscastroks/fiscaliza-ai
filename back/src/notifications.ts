import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { database } from './db.js';
import {
  callNotificationFollowers,
  municipalities,
  officialCalls,
  userPushTokens,
} from './schema.js';
import type {
  FollowCallNotificationPayload,
  PushNotificationResult,
  PushTokenRegistrationPayload,
  TestNotificationPayload,
  UnfollowCallNotificationPayload,
} from '../../shared/contracts.js';

export function isExpoPushToken(token: string): boolean {
  return typeof token === 'string' && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['));
}

export async function sendExpoPushNotification(
  payload: {
    to: string | string[];
    title: string;
    body: string;
    data?: Record<string, unknown>;
    sound?: string;
    badge?: number;
    channelId?: string;
  },
  customFetch: typeof fetch = fetch,
): Promise<PushNotificationResult> {
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  const validTokens = recipients.filter(isExpoPushToken);

  if (validTokens.length === 0) {
    return {
      success: false,
      error: 'Nenhum token Expo válido fornecido',
    };
  }

  const messages = validTokens.map((token) => ({
    to: token,
    ...(payload.sound ? { sound: payload.sound } : {}),
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    channelId: payload.channelId ?? 'fiscaliza-calls-v2',
  }));

  try {
    const res = await customFetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      return {
        success: false,
        error: `Erro ao enviar notificação push: status ${res.status}`,
      };
    }

    const data = (await res.json()) as { data?: Array<{ status: string; id?: string; message?: string }> };
    const first = data.data?.[0];
    if (first && first.status === 'ok') {
      return { success: true, ticketId: first.id };
    }
    return {
      success: false,
      error: first?.message ?? 'Falha ao registrar entrega no Expo Push Service',
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido de rede',
    };
  }
}

export async function notifyCallFollowers(
  db: ReturnType<typeof database>['db'],
  callId: string,
  updateInfo: {
    serviceType?: string;
    status: string;
    situation?: string;
  },
  customFetch: typeof fetch = fetch,
): Promise<number> {
  const followers = await db
    .select({
      id: callNotificationFollowers.id,
      pushToken: callNotificationFollowers.pushToken,
      lastNotifiedStatus: callNotificationFollowers.lastNotifiedStatus,
    })
    .from(callNotificationFollowers)
    .where(eq(callNotificationFollowers.callId, callId));

  if (followers.length === 0) return 0;

  let notifiedCount = 0;
  const title = updateInfo.serviceType
    ? `Atualização: ${updateInfo.serviceType}`
    : 'Atualização de chamado 1746';
  const body = `O chamado foi atualizado para: ${updateInfo.status}${
    updateInfo.situation ? ` (${updateInfo.situation})` : ''
  }.`;

  for (const follower of followers) {
    if (follower.lastNotifiedStatus === updateInfo.status) continue;

    const res = await sendExpoPushNotification(
      {
        to: follower.pushToken,
        title,
        body,
        data: {
          callId,
          status: updateInfo.status,
        },
      },
      customFetch,
    );

    if (res.success) {
      notifiedCount++;
      await db
        .update(callNotificationFollowers)
        .set({ lastNotifiedStatus: updateInfo.status })
        .where(eq(callNotificationFollowers.id, follower.id));
    }
  }

  return notifiedCount;
}

export function registerNotificationRoutes(
  app: FastifyInstance,
  options: {
    customFetch?: typeof fetch;
  } = {},
) {
  const customFetch = options.customFetch ?? fetch;

  // Registrar ou atualizar o token de push do aparelho
  app.post<{ Body: PushTokenRegistrationPayload }>(
    '/api/v1/notifications/register-token',
    {
      schema: {
        body: {
          type: 'object',
          required: ['token', 'platform'],
          properties: {
            token: { type: 'string', minLength: 1 },
            platform: { type: 'string', enum: ['android', 'ios', 'web'] },
            municipalityId: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const { token, platform, municipalityId: rawMunicipalityId } = req.body;
      const { db } = database();

      const municipalityId = rawMunicipalityId || '3304557';
      const [muni] = await db
        .select({ id: municipalities.id })
        .from(municipalities)
        .where(eq(municipalities.id, municipalityId))
        .limit(1);

      if (!muni) {
        return reply.status(400).send({
          success: false,
          error: 'Município não cadastrado.',
        });
      }

      const userId = req.user?.id ?? null;

      await db
        .insert(userPushTokens)
        .values({
          id: randomUUID(),
          userId,
          pushToken: token,
          platform,
          municipalityId,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userPushTokens.pushToken,
          set: {
            userId: userId ?? undefined,
            platform,
            municipalityId,
            updatedAt: new Date(),
          },
        });

      return reply.send({ success: true, message: 'Token registrado com sucesso.' });
    },
  );

  // Começar a seguir notificações de um chamado específico
  app.post<{ Body: FollowCallNotificationPayload }>(
    '/api/v1/notifications/follow-call',
    {
      schema: {
        body: {
          type: 'object',
          required: ['callId', 'token'],
          properties: {
            callId: { type: 'string', minLength: 1 },
            token: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (req, reply) => {
      const { callId, token } = req.body;
      const { db } = database();

      // Verifica se o chamado existe
      const [call] = await db
        .select({ id: officialCalls.id, officialStatus: officialCalls.officialStatus })
        .from(officialCalls)
        .where(eq(officialCalls.id, callId))
        .limit(1);

      if (!call) {
        return reply.status(404).send({
          success: false,
          error: 'Chamado oficial não encontrado.',
        });
      }

      // Garante que o token está registrado
      const [tokenRow] = await db
        .select({ pushToken: userPushTokens.pushToken })
        .from(userPushTokens)
        .where(eq(userPushTokens.pushToken, token))
        .limit(1);

      if (!tokenRow) {
        await db.insert(userPushTokens).values({
          id: randomUUID(),
          userId: req.user?.id ?? null,
          pushToken: token,
          platform: 'android',
          municipalityId: '3304557',
        });
      }

      await db
        .insert(callNotificationFollowers)
        .values({
          id: randomUUID(),
          callId,
          pushToken: token,
          userId: req.user?.id ?? null,
          lastNotifiedStatus: call.officialStatus,
        })
        .onConflictDoNothing();

      return reply.send({ success: true, message: 'Notificações ativadas para este chamado.' });
    },
  );

  // Deixar de seguir notificações de um chamado
  app.delete<{ Body: UnfollowCallNotificationPayload }>(
    '/api/v1/notifications/follow-call',
    {
      schema: {
        body: {
          type: 'object',
          required: ['callId', 'token'],
          properties: {
            callId: { type: 'string', minLength: 1 },
            token: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (req, reply) => {
      const { callId, token } = req.body;
      const { db } = database();

      await db
        .delete(callNotificationFollowers)
        .where(
          and(
            eq(callNotificationFollowers.callId, callId),
            eq(callNotificationFollowers.pushToken, token),
          ),
        );

      return reply.send({ success: true, message: 'Notificações desativadas para este chamado.' });
    },
  );

  // Enviar uma notificação push de teste direto ao aparelho
  app.post<{ Body: TestNotificationPayload }>(
    '/api/v1/notifications/test',
    {
      schema: {
        body: {
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string', minLength: 1 },
            title: { type: 'string' },
            body: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const { token, title, body } = req.body;

      const result = await sendExpoPushNotification(
        {
          to: token,
          title: title || 'Teste do Fiscaliza aí',
          body: body || 'Notificações push estão ativas e funcionando no seu aparelho!',
          data: { type: 'test', timestamp: Date.now() },
        },
        customFetch,
      );

      return reply.send(result);
    },
  );
}
