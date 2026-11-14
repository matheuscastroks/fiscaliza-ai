import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';
import { users } from '../src/schema.js';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '../src/auth.js';

test('registration validates anonymous requests before accessing the database', async (t) => {
  const app = await buildApp();
  t.after(() => app.close());
  let address = 1;
  for (const payload of [
    {},
    { name: 'Ana', email: 'invalid', password: 'long-password' },
    { name: ' ', email: 'ana@example.test', password: 'long-password' },
    { name: 'Ana', email: 'ana@example.test', password: 'short' },
    {
      name: 'Ana',
      email: 'ana@example.test',
      password: 'long-password',
      role: 'admin',
    },
    {
      name: 'Ana',
      email: 'ana@example.test',
      password: 'long-password',
      municipalityId: '3304557',
    },
  ]) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      remoteAddress: `198.51.100.${address++}`,
      payload,
    });
    assert.equal(response.statusCode, 400, response.body);
    assert.equal(response.json().success, false);
  }
  const deniedOrigin = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    headers: { origin: 'https://evil.test' },
    payload: {
      name: 'Ana',
      email: 'ana@example.test',
      password: 'long-password',
    },
  });
  assert.equal(deniedOrigin.statusCode, 403);
});

test(
  'PostgreSQL: registration persists a citizen, hashes passwords and starts a session',
  {
    skip: !process.env.DATABASE_URL
      ? 'DATABASE_URL absent; PostgreSQL integration not run'
      : false,
  },
  async (t) => {
    const app = await buildApp();
    const { db, pool } = database();
    t.after(async () => {
      await app.close();
      await pool.end();
    });
    const email = `signup-${randomUUID()}@example.test`;
    const payload = {
      name: '  Nova pessoa  ',
      email: email.toUpperCase(),
      password: 'Registration-test-123!',
    };
    const headers = { 'x-fiscaliza-client': 'citizen' };
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers,
      payload,
    });
    assert.equal(response.statusCode, 201, response.body);
    const { user, token } = response.json().data;
    // Navegador: só o cookie httpOnly, nunca o token no corpo.
    assert.equal(token, undefined);
    assert.equal(user.email, email);
    assert.equal(user.name, 'Nova pessoa');
    assert.equal(user.role, 'citizen');
    assert.equal(user.municipality, null);
    assert.equal('passwordHash' in user, false);
    assert.ok(
      response.headers['set-cookie']?.toString().startsWith('citizen_session='),
    );
    const [stored] = await db.select().from(users).where(eq(users.id, user.id));
    assert.notEqual(stored.passwordHash, payload.password);
    assert.equal(
      await verifyPassword(payload.password, stored.passwordHash),
      true,
    );
    assert.equal(
      (
        await app.inject({
          url: '/api/auth/me',
          headers: {
            cookie: String(response.headers['set-cookie']).split(';')[0],
          },
        })
      ).json().data.id,
      user.id,
    );
    // App nativo: token no corpo para o armazenamento seguro, sem cookie.
    const native = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'x-fiscaliza-client': 'citizen-native' },
      payload: { email, password: payload.password },
    });
    assert.equal(native.statusCode, 200, native.body);
    assert.equal(native.headers['set-cookie'], undefined);
    assert.equal(
      (
        await app.inject({
          url: '/api/auth/me',
          headers: { authorization: `Bearer ${native.json().data.token}` },
        })
      ).json().data.id,
      user.id,
    );
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload: { email, password: payload.password },
        })
      ).statusCode,
      200,
    );
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload: { email, password: 'wrong-password' },
        })
      ).statusCode,
      401,
    );
    assert.equal(
      (await app.inject({ method: 'POST', url: '/api/auth/register', payload }))
        .statusCode,
      409,
    );
    const concurrentEmail = `signup-${randomUUID()}@example.test`;
    const concurrent = await Promise.all(
      [0, 1].map(() =>
        app.inject({
          method: 'POST',
          url: '/api/auth/register',
          payload: { ...payload, email: concurrentEmail },
        }),
      ),
    );
    assert.deepEqual(
      concurrent.map((item) => item.statusCode).sort(),
      [201, 409],
    );
  },
);
