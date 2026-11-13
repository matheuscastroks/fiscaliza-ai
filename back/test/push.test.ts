import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';
import { importPartition } from '../src/integrations/rio1746/importer.js';
import { applyMigrations } from '../src/migrations.js';
import { notifyPendingFollowers, notifyStatusChanges } from '../src/notifications.js';
import { callNotificationFollowers, officialCalls, userPushTokens } from '../src/schema.js';
import { bigQueryFixture } from './bigquery-fixture.js';
import { createCitizen } from './helpers.js';

const row = (id: string, status: string, situation: string) => ({
  id_chamado: id,
  data_inicio: '2026-09-20T10:00:00',
  tipo: 'Iluminação Pública',
  subtipo: 'Reparo de luminária',
  status,
  situacao: situation,
  latitude: -22.91,
  longitude: -43.2,
  nome_bairro: 'Centro',
  data_particao: '2026-09-20',
});

const call = (suffix: string) => `push-${suffix}`;

async function setup(t: import('node:test').TestContext) {
  const app = await buildApp();
  const { db, pool } = database();
  const cleanups: Array<() => Promise<unknown>> = [];
  t.after(async () => {
    for (const cleanup of cleanups) await cleanup();
    await app.close();
    await pool.end();
  });
  await applyMigrations(pool);
  return { app, db, pool, cleanups };
}

test(
  'PostgreSQL: o aparelho pertence a uma conta; outra conta não segue nem desfaz, mas pode assumir o token',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { app, db, cleanups } = await setup(t);
    const externalId = call(randomUUID());
    cleanups.push(() =>
      db.delete(officialCalls).where(eq(officialCalls.externalId, externalId)),
    );
    await importPartition(
      bigQueryFixture(() => [row(externalId, 'Aberto', 'Não Encerrado')]),
      db,
      '2026-09-20',
      { pageSize: 10 },
    );
    const callId = `rio1746-${externalId}`;
    const token = `ExponentPushToken[${randomUUID()}]`;
    const a = await createCitizen(app, db);
    const b = await createCitizen(app, db);

    const post = (user: { headers: Record<string, string> }, url: string, payload: unknown, method: 'POST' | 'DELETE' = 'POST') =>
      app.inject({ method, url: `/api/v1/notifications/${url}`, headers: user.headers, payload: payload as object });

    // Entradas inválidas
    assert.equal((await post(a, 'register-token', { token: 'curto', platform: 'android' })).statusCode, 400);
    assert.equal(
      (await post(a, 'register-token', { token: 'x'.repeat(30), platform: 'android' })).statusCode,
      400,
    );
    assert.equal(
      (await post(a, 'register-token', { token, platform: 'android', extra: 1 })).statusCode,
      400,
    );
    // Sem sessão
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/api/v1/notifications/register-token',
          payload: { token, platform: 'android' },
        })
      ).statusCode,
      401,
    );

    assert.equal((await post(a, 'register-token', { token, platform: 'android' })).statusCode, 200);
    // Seguir sem ser dono do aparelho
    assert.equal((await post(b, 'follow-call', { callId, token })).statusCode, 403);
    assert.equal((await post(a, 'follow-call', { callId, token })).statusCode, 200);
    assert.equal((await post(a, 'follow-call', { callId: 'nao-existe', token })).statusCode, 404);
    assert.equal((await post(b, 'follow-call', { callId, token }, 'DELETE')).statusCode, 403);
    assert.equal(
      (await db.select().from(callNotificationFollowers).where(eq(callNotificationFollowers.pushToken, token))).length,
      1,
    );

    // Troca de conta no mesmo aparelho: os avisos da conta anterior saem.
    assert.equal((await post(b, 'register-token', { token, platform: 'android' })).statusCode, 200);
    const [owner] = await db.select().from(userPushTokens).where(eq(userPushTokens.pushToken, token));
    assert.equal(owner.userId, b.id);
    assert.equal(
      (await db.select().from(callNotificationFollowers).where(eq(callNotificationFollowers.pushToken, token))).length,
      0,
    );
    assert.equal((await post(a, 'follow-call', { callId, token })).statusCode, 403);
    assert.equal((await post(b, 'follow-call', { callId, token })).statusCode, 200);
    assert.equal((await post(b, 'follow-call', { callId, token }, 'DELETE')).statusCode, 200);
  },
);

test(
  'PostgreSQL: a sincronização avisa quem segue só quando a situação muda, em lote, e apaga token inválido',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { app, db, cleanups } = await setup(t);
    const ids = [call(randomUUID()), call(randomUUID()), call(randomUUID())];
    cleanups.push(() => db.delete(officialCalls).where(inArray(officialCalls.externalId, ids)));
    const initial = ids.map((id) => row(id, 'Aberto', 'Não Encerrado'));
    await importPartition(bigQueryFixture(() => initial), db, '2026-09-20', { pageSize: 10 });

    const tokens = [
      `ExponentPushToken[${randomUUID()}]`,
      `ExponentPushToken[${randomUUID()}]`,
    ];
    const users = [await createCitizen(app, db), await createCitizen(app, db)];
    for (const [i, user] of users.entries()) {
      await app.inject({
        method: 'POST',
        url: '/api/v1/notifications/register-token',
        headers: user.headers,
        payload: { token: tokens[i], platform: 'android' },
      });
      // o primeiro segue os dois primeiros chamados; o segundo, só o primeiro
      for (const id of ids.slice(0, i === 0 ? 2 : 1))
        await app.inject({
          method: 'POST',
          url: '/api/v1/notifications/follow-call',
          headers: user.headers,
          payload: { callId: `rio1746-${id}`, token: tokens[i] },
        });
    }

    const sent: Array<{ to: string; title: string; body: string }> = [];
    let batches = 0;
    const expo = (async (_url: unknown, init?: RequestInit) => {
      batches += 1;
      const messages = JSON.parse(init!.body as string) as typeof sent;
      sent.push(...messages);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: messages.map((message) =>
            message.to === tokens[1]
              ? { status: 'error', details: { error: 'DeviceNotRegistered' } }
              : { status: 'ok', id: randomUUID() },
          ),
        }),
      } as unknown as Response;
    }) as typeof fetch;

    const changed = [
      row(ids[0], 'Em andamento', 'Em execução'),
      row(ids[1], 'Aberto', 'Não Encerrado'), // sem mudança
      row(ids[2], 'Fechado', 'Encerrado'), // mudou, mas ninguém segue
    ];
    const result = await importPartition(bigQueryFixture(() => changed), db, '2026-09-20', {
      pageSize: 10,
      onStatusChanges: async (changes) => {
        await notifyStatusChanges(db, changes, expo);
      },
    });
    assert.equal(result.updated, 2, "a linha sem mudança não é reescrita");
    assert.equal(batches, 1);
    assert.equal(sent.length, 2);
    assert.deepEqual(
      sent.map((message) => message.to).sort(),
      [...tokens].sort(),
    );
    assert.match(sent[0].body, /nova situação: Em andamento \(Em execução\)/);

    // Token recusado pela Expo sai do banco; o aceito guarda o estado avisado.
    const stored = await db.select().from(userPushTokens).where(inArray(userPushTokens.pushToken, tokens));
    assert.deepEqual(stored.map((item) => item.pushToken), [tokens[0]]);
    const [follower] = await db
      .select()
      .from(callNotificationFollowers)
      .where(eq(callNotificationFollowers.callId, `rio1746-${ids[0]}`));
    assert.equal(follower.lastNotifiedStatus, 'Em andamento (Em execução)');

    // Repetir a mesma sincronização não envia de novo.
    sent.length = 0;
    await importPartition(bigQueryFixture(() => changed), db, '2026-09-20', {
      pageSize: 10,
      onStatusChanges: async (changes) => {
        await notifyStatusChanges(db, changes, expo);
      },
    });
    assert.equal(sent.length, 0);

    await db.delete(officialCalls).where(inArray(officialCalls.externalId, ids));
  },
);

test(
  'PostgreSQL: aviso que falhou na Expo sai na próxima rodada da caixa de saída, uma vez só',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { app, db, cleanups } = await setup(t);
    const id = call(randomUUID());
    cleanups.push(() => db.delete(officialCalls).where(eq(officialCalls.externalId, id)));
    await importPartition(bigQueryFixture(() => [row(id, 'Aberto', 'Não Encerrado')]), db, '2026-09-20', {
      pageSize: 10,
    });
    const token = `ExponentPushToken[${randomUUID()}]`;
    const user = await createCitizen(app, db);
    await app.inject({
      method: 'POST',
      url: '/api/v1/notifications/register-token',
      headers: user.headers,
      payload: { token, platform: 'android' },
    });
    await app.inject({
      method: 'POST',
      url: '/api/v1/notifications/follow-call',
      headers: user.headers,
      payload: { callId: `rio1746-${id}`, token },
    });

    // Na sincronização, a Expo está fora do ar.
    const down = (async () => ({ ok: false, status: 503 }) as Response) as typeof fetch;
    await importPartition(bigQueryFixture(() => [row(id, 'Em andamento', 'Em execução')]), db, '2026-09-20', {
      pageSize: 10,
      onStatusChanges: async (changes) => {
        assert.equal(await notifyStatusChanges(db, changes, down), 0);
      },
    });

    const sent: string[] = [];
    const up = (async (_url: unknown, init?: RequestInit) => {
      const messages = JSON.parse(init!.body as string) as Array<{ to: string; body: string }>;
      sent.push(...messages.filter((message) => message.to === token).map((message) => message.body));
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: messages.map(() => ({ status: 'ok', id: randomUUID() })) }),
      } as unknown as Response;
    }) as typeof fetch;

    await notifyPendingFollowers(db, up);
    assert.equal(sent.length, 1);
    assert.match(sent[0], /Em andamento \(Em execução\)/);
    await notifyPendingFollowers(db, up);
    assert.equal(sent.length, 1, 'não repete o aviso já entregue');
  },
);
