import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { tokenHash } from '../src/auth.js';
import { database } from '../src/db.js';
import { applyMigrations } from '../src/migrations.js';
import { sessions, userPushTokens } from '../src/schema.js';
import { createCitizen, uploadPhoto } from './helpers.js';

async function setup(t: import('node:test').TestContext) {
  const app = await buildApp();
  const { db, pool } = database();
  t.after(async () => {
    await app.close();
    await pool.end();
  });
  await applyMigrations(pool);
  return { app, db };
}

const registerToken = (
  app: Awaited<ReturnType<typeof buildApp>>,
  headers: Record<string, string>,
  token: string,
) =>
  app.inject({
    method: 'POST',
    url: '/api/v1/notifications/register-token',
    headers,
    payload: { token, platform: 'android' },
  });

test(
  'PostgreSQL: sair neste aparelho desliga os avisos dele; outra conta não desliga o token alheio',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { app, db } = await setup(t);
    const a = await createCitizen(app, db);
    const b = await createCitizen(app, db);
    const token = `ExponentPushToken[${randomUUID()}]`;
    assert.equal((await registerToken(app, a.headers, token)).statusCode, 200);

    const stranger = await app.inject({
      method: 'DELETE',
      url: '/api/v1/notifications/register-token',
      headers: b.headers,
      payload: { token },
    });
    assert.equal(stranger.statusCode, 200);
    assert.equal(
      (await db.select().from(userPushTokens).where(eq(userPushTokens.pushToken, token))).length,
      1,
    );

    const own = await app.inject({
      method: 'DELETE',
      url: '/api/v1/notifications/register-token',
      headers: a.headers,
      payload: { token },
    });
    assert.equal(own.statusCode, 200, own.body);
    assert.equal(
      (await db.select().from(userPushTokens).where(eq(userPushTokens.pushToken, token))).length,
      0,
    );
  },
);

test(
  'PostgreSQL: sair em todos os aparelhos também apaga os tokens de aviso da conta',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { app, db } = await setup(t);
    const a = await createCitizen(app, db);
    const token = `ExponentPushToken[${randomUUID()}]`;
    await registerToken(app, a.headers, token);
    const all = await app.inject({ method: 'POST', url: '/api/auth/logout-all', headers: a.headers });
    assert.equal(all.statusCode, 200, all.body);
    assert.equal(
      (await db.select().from(userPushTokens).where(eq(userPushTokens.userId, a.id))).length,
      0,
    );
  },
);

test(
  'PostgreSQL: sessão em uso perto de vencer ganha mais 7 dias; a recente não é regravada',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { app, db } = await setup(t);
    const a = await createCitizen(app, db);
    const token = a.headers.authorization.slice('Bearer '.length);
    const where = eq(sessions.tokenHash, tokenHash(token));
    const expiresAt = async () =>
      (await db.select({ at: sessions.expiresAt }).from(sessions).where(where))[0].at.getTime();

    const fresh = await expiresAt();
    await app.inject({ url: '/api/auth/me', headers: a.headers });
    assert.equal(await expiresAt(), fresh);

    await db.update(sessions).set({ expiresAt: new Date(Date.now() + 60 * 60 * 1000) }).where(where);
    const me = await app.inject({ url: '/api/auth/me', headers: a.headers });
    assert.equal(me.statusCode, 200);
    assert.ok(await expiresAt() > Date.now() + 6 * 24 * 60 * 60 * 1000);
  },
);

test(
  'PostgreSQL: foto de perfil não fica em cache compartilhado (CDN)',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { app, db } = await setup(t);
    const a = await createCitizen(app, db);
    const url = await uploadPhoto(app, a.headers);
    const response = await app.inject({ url, headers: a.headers });
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['cache-control'], 'private, no-store');
  },
);
