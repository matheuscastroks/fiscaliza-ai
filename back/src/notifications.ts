import { randomUUID } from 'node:crypto';
import { and, count, eq, inArray, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import type { Database } from './db.js';
import { httpError, ok } from './http-errors.js';
import {
  callNotificationFollowers,
  officialCalls,
  userPushTokens,
} from './schema.js';
import type {
  FollowCallNotificationPayload,
  PushNotificationResult,
  PushTokenRegistrationPayload,
  UnfollowCallNotificationPayload,
} from '../../shared/contracts.js';

export const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;
export const MAX_FOLLOWS_PER_TOKEN = 200;

export function isExpoPushToken(token: string): boolean {
  return typeof token === 'string' && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['));
}

// Texto único do estado de um chamado, usado na mensagem e para não avisar
// duas vezes sobre o mesmo estado.
export function callStateLabel(
  status: string | null | undefined,
  situation?: string | null,
): string {
  const base = status?.trim() || 'Sem status';
  return situation?.trim() ? `${base} (${situation.trim()})` : base;
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
    const res = await customFetch(EXPO_PUSH_URL, {
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

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};
export type PushOutcome = {
  ok: boolean;
  /** A Expo informou que o aparelho não recebe mais avisos: o token deve sair. */
  deviceNotRegistered?: boolean;
};

// Envia em lotes de até 100 mensagens por requisição e devolve um resultado
// por mensagem, na mesma ordem.
export async function sendExpoPushBatch(
  messages: PushMessage[],
  customFetch: typeof fetch = fetch,
): Promise<PushOutcome[]> {
  const outcomes: PushOutcome[] = messages.map(() => ({ ok: false }));
  for (let start = 0; start < messages.length; start += EXPO_BATCH_SIZE) {
    const slice = messages.slice(start, start + EXPO_BATCH_SIZE);
    try {
      const res = await customFetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        // Sem prazo, uma Expo lenta seguraria a sincronização (e o lock da fonte).
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify(
          slice.map((message) => ({
            ...message,
            data: message.data ?? {},
            channelId: 'fiscaliza-calls-v2',
          })),
        ),
      });
      if (!res.ok) continue;
      const body = (await res.json()) as {
        data?: Array<{ status: string; details?: { error?: string } }>;
      };
      slice.forEach((_, index) => {
        const ticket = body.data?.[index];
        outcomes[start + index] = {
          ok: ticket?.status === 'ok',
          deviceNotRegistered: ticket?.details?.error === 'DeviceNotRegistered',
        };
      });
    } catch {
      // A rede falhou neste lote: as mensagens ficam como não enviadas e
      // serão tentadas na próxima sincronização.
    }
  }
  return outcomes;
}

export type CallStatusChange = {
  callId: string;
  serviceType?: string | null;
  status: string | null;
  situation?: string | null;
};

type PendingPush = { followerId: string; state: string; message: PushMessage };

function pushMessage(
  follower: { callId: string; pushToken: string },
  call: { serviceType?: string | null; status: string | null },
  state: string,
): PushMessage {
  return {
    to: follower.pushToken,
    title: call.serviceType ? `Chamado de ${call.serviceType}` : 'Chamado do 1746',
    body: `A Prefeitura publicou nova situação: ${state}.`,
    data: { callId: follower.callId, status: call.status },
  };
}

// Envia e só então marca a situação como avisada: o que falhou continua
// pendente e sai no próximo `notifyPendingFollowers`.
async function sendPending(
  db: Database,
  pending: PendingPush[],
  customFetch: typeof fetch,
): Promise<number> {
    if (pending.length === 0) return 0;

    const outcomes = await sendExpoPushBatch(
      pending.map((item) => item.message),
      customFetch,
    );
    const delivered = pending.filter((_, index) => outcomes[index].ok);
    const invalidTokens = [
      ...new Set(
        pending
          .filter((_, index) => outcomes[index].deviceNotRegistered)
          .map((item) => item.message.to),
      ),
    ];

    if (delivered.length > 0) {
      await db.execute(sql`
        UPDATE call_notification_followers AS f
        SET last_notified_status = u.state
        FROM unnest(ARRAY[${sql.join(delivered.map((item) => sql`${item.followerId}`), sql`, `)}]::text[],
                    ARRAY[${sql.join(delivered.map((item) => sql`${item.state}`), sql`, `)}]::text[]) AS u(id, state)
        WHERE f.id = u.id
      `);
    }
    if (invalidTokens.length > 0)
      await db
        .delete(userPushTokens)
        .where(inArray(userPushTokens.pushToken, invalidTokens));
    return delivered.length;
}

/**
 * Caixa de saída: avisa todo seguidor cuja última situação avisada difere da
 * situação gravada do chamado. Cobre os envios que falharam antes (Expo fora,
 * rede) e as mudanças gravadas sem aviso. Nunca lança.
 */
export async function notifyPendingFollowers(
  db: Database,
  customFetch: typeof fetch = fetch,
  limit = 5000,
): Promise<number> {
  try {
    const result = await db.execute<{
      follower_id: string;
      call_id: string;
      push_token: string;
      service_type: string | null;
      status: string | null;
      situation: string | null;
      last_notified: string | null;
    }>(sql`
      SELECT f.id AS follower_id, f.call_id, f.push_token, f.last_notified_status AS last_notified,
             c.service_type, c.official_status AS status, c.official_situation AS situation
      FROM call_notification_followers f
      JOIN official_calls c ON c.id = f.call_id
      ORDER BY f.id
      LIMIT ${limit}
    `);
    const pending: PendingPush[] = [];
    for (const row of result.rows) {
      const state = callStateLabel(row.status, row.situation);
      if (row.last_notified === state) continue;
      pending.push({
        followerId: row.follower_id,
        state,
        message: pushMessage(
          { callId: row.call_id, pushToken: row.push_token },
          { serviceType: row.service_type, status: row.status },
          state,
        ),
      });
    }
    return await sendPending(db, pending, customFetch);
  } catch (error) {
    console.error('[push] falha na caixa de saída de avisos:', error);
    return 0;
  }
}

// Avisa quem segue os chamados que mudaram de situação. Devolve quantos avisos
// foram aceitos pela Expo. Nunca lança: falha de envio não pode derrubar a
// sincronização que a chamou.
export async function notifyStatusChanges(
  db: Database,
  changes: CallStatusChange[],
  customFetch: typeof fetch = fetch,
): Promise<number> {
  if (changes.length === 0) return 0;
  try {
    const byCall = new Map(changes.map((change) => [change.callId, change]));
    const followers = await db
      .select({
        id: callNotificationFollowers.id,
        callId: callNotificationFollowers.callId,
        pushToken: callNotificationFollowers.pushToken,
        lastNotified: callNotificationFollowers.lastNotifiedStatus,
      })
      .from(callNotificationFollowers)
      .where(inArray(callNotificationFollowers.callId, [...byCall.keys()]));

    const pending: PendingPush[] = [];
    for (const follower of followers) {
      const change = byCall.get(follower.callId);
      if (!change) continue;
      const state = callStateLabel(change.status, change.situation);
      if (follower.lastNotified === state) continue;
      pending.push({
        followerId: follower.id,
        state,
        message: pushMessage(follower, change, state),
      });
    }
    return await sendPending(db, pending, customFetch);
  } catch (error) {
    console.error('[push] falha ao enviar avisos de mudança de situação:', error);
    return 0;
  }
}

const tokenSchema = { type: 'string', minLength: 20, maxLength: 200 };
const callIdSchema = { type: 'string', minLength: 1, maxLength: 100 };

export function registerNotificationRoutes(
  app: FastifyInstance,
  options: {
    db: Database;
  },
) {
  const { db } = options;

  // Sair da conta neste aparelho: o token deixa de receber avisos da conta.
  // Só apaga o token se ele for desta conta (outra conta não desliga o aparelho
  // de ninguém). Os avisos que ele seguia saem junto (ON DELETE CASCADE).
  app.delete<{ Body: { token: string } }>(
    '/api/v1/notifications/register-token',
    {
      schema: {
        body: {
          type: 'object',
          required: ['token'],
          additionalProperties: false,
          properties: { token: tokenSchema },
        },
      },
    },
    async (req) => {
      await db
        .delete(userPushTokens)
        .where(
          and(
            eq(userPushTokens.pushToken, req.body.token),
            eq(userPushTokens.userId, req.user!.id),
          ),
        );
      return ok(null);
    },
  );

  // Registra o token do aparelho para a conta logada. Trocar de conta no mesmo
  // aparelho é legítimo: o token passa para a conta nova e os avisos que a
  // conta anterior tinha neste aparelho deixam de existir.
  app.post<{ Body: PushTokenRegistrationPayload }>(
    '/api/v1/notifications/register-token',
    {
      schema: {
        body: {
          type: 'object',
          required: ['token', 'platform'],
          additionalProperties: false,
          properties: {
            token: tokenSchema,
            platform: { type: 'string', enum: ['android', 'ios'] },
            municipalityId: { type: 'string', pattern: '^[0-9]{7}$' },
          },
        },
      },
    },
    async (req) => {
      const { token, platform } = req.body;
      if (!isExpoPushToken(token))
        throw httpError(400, 'Token de avisos inválido.');
      const user = req.user!;
      const municipalityId = user.municipality!.id;

      await db.transaction(async (tx) => {
        const [existing] = await tx
          .select({ userId: userPushTokens.userId })
          .from(userPushTokens)
          .where(eq(userPushTokens.pushToken, token))
          .limit(1);
        if (existing && existing.userId !== user.id)
          await tx
            .delete(callNotificationFollowers)
            .where(eq(callNotificationFollowers.pushToken, token));
        await tx
          .insert(userPushTokens)
          .values({
            id: randomUUID(),
            userId: user.id,
            pushToken: token,
            platform,
            municipalityId,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: userPushTokens.pushToken,
            set: {
              userId: user.id,
              platform,
              municipalityId,
              updatedAt: new Date(),
            },
          });
      });

      return ok({ message: 'Token registrado com sucesso.' });
    },
  );

  const ownsToken = async (token: string, userId: string) => {
    const [row] = await db
      .select({ id: userPushTokens.id })
      .from(userPushTokens)
      .where(
        and(
          eq(userPushTokens.pushToken, token),
          eq(userPushTokens.userId, userId),
        ),
      )
      .limit(1);
    return Boolean(row);
  };

  // Começar a seguir um chamado. O token precisa ser de um aparelho da conta.
  app.post<{ Body: FollowCallNotificationPayload }>(
    '/api/v1/notifications/follow-call',
    {
      schema: {
        body: {
          type: 'object',
          required: ['callId', 'token'],
          additionalProperties: false,
          properties: { callId: callIdSchema, token: tokenSchema },
        },
      },
    },
    async (req) => {
      const { callId, token } = req.body;
      const user = req.user!;

      const [call] = await db
        .select({
          id: officialCalls.id,
          officialStatus: officialCalls.officialStatus,
          officialSituation: officialCalls.officialSituation,
        })
        .from(officialCalls)
        .where(eq(officialCalls.id, callId))
        .limit(1);
      if (!call)
        throw httpError(404, 'Chamado oficial não encontrado.');

      if (!(await ownsToken(token, user.id)))
        throw httpError(403, 'Este aparelho não está registrado na sua conta.');

      const [{ total }] = await db
        .select({ total: count() })
        .from(callNotificationFollowers)
        .where(eq(callNotificationFollowers.pushToken, token));
      if (total >= MAX_FOLLOWS_PER_TOKEN)
        throw httpError(400, 'Você já acompanha o máximo de chamados com avisos.');

      await db
        .insert(callNotificationFollowers)
        .values({
          id: randomUUID(),
          callId,
          pushToken: token,
          userId: user.id,
          lastNotifiedStatus: callStateLabel(
            call.officialStatus,
            call.officialSituation,
          ),
        })
        .onConflictDoNothing();

      return ok({ message: 'Notificações ativadas para este chamado.' });
    },
  );

  app.delete<{ Body: UnfollowCallNotificationPayload }>(
    '/api/v1/notifications/follow-call',
    {
      schema: {
        body: {
          type: 'object',
          required: ['callId', 'token'],
          additionalProperties: false,
          properties: { callId: callIdSchema, token: tokenSchema },
        },
      },
    },
    async (req) => {
      const { callId, token } = req.body;
      if (!(await ownsToken(token, req.user!.id)))
        throw httpError(403, 'Este aparelho não está registrado na sua conta.');

      await db
        .delete(callNotificationFollowers)
        .where(
          and(
            eq(callNotificationFollowers.callId, callId),
            eq(callNotificationFollowers.pushToken, token),
          ),
        );

      return ok({ message: 'Notificações desativadas para este chamado.' });
    },
  );
}
