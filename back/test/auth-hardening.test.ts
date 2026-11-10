import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import {
  createLoginThrottle,
  hashPassword,
  needsRehash,
  verifyPassword,
} from '../src/auth.js';
import { database } from '../src/db.js';
import { users } from '../src/schema.js';
import { createCitizen } from './helpers.js';

const legacyHash = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};

test('senhas: formato novo, hash antigo ainda vale e pede nova gravação', async () => {
  const fresh = await hashPassword('Senha-de-teste-123');
  assert.match(fresh, /^s2:16:[0-9a-f]{32}:[0-9a-f]{128}$/);
  assert.equal(needsRehash(fresh), false);
  assert.equal(await verifyPassword('Senha-de-teste-123', fresh), true);
  assert.equal(await verifyPassword('outra', fresh), false);

  const old = legacyHash('Senha-antiga-123');
  assert.equal(needsRehash(old), true);
  assert.equal(await verifyPassword('Senha-antiga-123', old), true);
  assert.equal(await verifyPassword('errada', old), false);
  // custo exagerado vindo de um hash adulterado é recusado
  assert.equal(await verifyPassword('x', 's2:30:aa:bb'), false);
});

test('limite de falhas por conta expira com o tempo e zera no acerto', () => {
  let clock = 0;
  const throttle = createLoginThrottle(3, 1000, () => clock);
  for (let i = 0; i < 3; i++) throttle.fail('a@example.test');
  assert.equal(throttle.blocked('a@example.test'), true);
  assert.equal(throttle.blocked('b@example.test'), false);
  clock = 1001;
  assert.equal(throttle.blocked('a@example.test'), false);
  throttle.fail('a@example.test');
  throttle.reset('a@example.test');
  assert.equal(throttle.blocked('a@example.test'), false);
});

test(
  'PostgreSQL: login regrava hash antigo, limita falhas por conta, sai com sessão vencida e em todos os aparelhos',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const app = await buildApp();
    const { db, pool } = database();
    t.after(async () => {
      await app.close();
      await pool.end();
    });
    const citizen = await createCitizen(app, db);
    let ip = 1;
    const login = (email: string, password: string) =>
      app.inject({
        method: 'POST',
        url: '/api/auth/login',
        remoteAddress: `198.51.100.${ip++}`,
        payload: { email, password },
      });

    // hash antigo é regravado no custo novo no primeiro login certo
    await db
      .update(users)
      .set({ passwordHash: legacyHash('Senha-de-teste-123') })
      .where(eq(users.id, citizen.id));
    const first = await login(citizen.email, 'Senha-de-teste-123');
    assert.equal(first.statusCode, 200);
    const [stored] = await db.select().from(users).where(eq(users.id, citizen.id));
    assert.match(stored.passwordHash, /^s2:16:/);

    // e-mail inexistente responde igual a senha errada
    const unknown = await login('ninguem@example.test', 'qualquer-senha-1');
    assert.equal(unknown.statusCode, 401);
    assert.equal(unknown.json().error, (await login(citizen.email, 'errada-123')).json().error);

    // sair de todos os aparelhos
    const second = await login(citizen.email, 'Senha-de-teste-123');
    const tokenA = first.json().data.token as string;
    const tokenB = second.json().data.token as string;
    const me = (token: string) =>
      app.inject({ url: '/api/auth/me', headers: { authorization: `Bearer ${token}` } });
    assert.equal((await me(tokenA)).statusCode, 200);
    const all = await app.inject({
      method: 'POST',
      url: '/api/auth/logout-all',
      headers: { authorization: `Bearer ${tokenB}` },
    });
    assert.equal(all.statusCode, 200);
    assert.equal((await me(tokenA)).statusCode, 401);
    assert.equal((await me(tokenB)).statusCode, 401);

    // sair com a sessão já vencida limpa o cookie em vez de dar 401
    const expired = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { cookie: `citizen_session=${tokenA}`, 'x-fiscaliza-client': 'citizen', origin: 'http://localhost:5173' },
    });
    assert.equal(expired.statusCode, 200, expired.body);
    assert.match(String(expired.headers['set-cookie']), /citizen_session=;/);

    // 10 falhas na mesma conta (de IPs diferentes) bloqueiam a conta por um tempo
    for (let i = 0; i < 10; i++) await login(citizen.email, `errada-${i}-abc`);
    const blocked = await login(citizen.email, 'Senha-de-teste-123');
    assert.equal(blocked.statusCode, 429);
    assert.equal((await login('outra-pessoa@example.test', 'abc-123-xyz')).statusCode, 401);
  },
);
