import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { database } from '../src/db.js';
import { applyMigrations } from '../src/migrations.js';
import { createKeyedLock } from '../src/keyed-lock.js';
import { attachments, users } from '../src/schema.js';
import { createCitizen, uploadPhoto } from './helpers.js';

const exists = (path: string) =>
  access(path).then(
    () => true,
    () => false,
  );
const timeout = () => new Error('timeout');

test('config: produção exige variáveis essenciais e recusa senha de exemplo', () => {
  const base: NodeJS.ProcessEnv = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://fiscaliza:senha-forte-de-verdade@db:5432/fiscaliza',
    WEB_ORIGINS: 'https://app.example.test',
    TRUST_PROXY: '172.30.97.0/24',
  };
  assert.equal(loadConfig(base).production, true);
  assert.deepEqual(loadConfig(base).webOrigins, ['https://app.example.test']);
  for (const key of ['DATABASE_URL', 'WEB_ORIGINS', 'TRUST_PROXY']) {
    const incomplete: NodeJS.ProcessEnv = { ...base };
    delete incomplete[key];
    assert.throws(() => loadConfig(incomplete), new RegExp(key));
  }
  assert.throws(
    () =>
      loadConfig({
        ...base,
        DATABASE_URL: 'postgres://fiscaliza:fiscaliza-local@db:5432/fiscaliza',
      }),
    /senha de exemplo/,
  );
  assert.throws(
    () => loadConfig({ ...base, WEB_ORIGINS: 'https://a.test,null' }),
    /WEB_ORIGINS/,
  );
  const dev = loadConfig({});
  assert.equal(dev.production, false);
  assert.ok(dev.databaseUrl.includes('localhost'));
});

test('produção: a API não sobe sem configuração e o CORS rejeita origens de desenvolvimento', async (t) => {
  const previous = { ...process.env };
  t.after(() => {
    process.env = previous;
  });
  process.env.NODE_ENV = 'production';
  delete process.env.WEB_ORIGINS;
  await assert.rejects(() => buildApp(), /Configuração incompleta/);

  process.env.WEB_ORIGINS = 'https://app.example.test';
  process.env.TRUST_PROXY = '172.30.97.0/24';
  const app = await buildApp({
    databaseUrl: 'postgres://fiscaliza:outra-senha-forte@localhost:5432/fiscaliza',
  });
  t.after(() => app.close());
  for (const origin of ['null', 'http://localhost:8081', 'exp://192.168.0.2:8081']) {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/api/auth/login',
      headers: { origin, 'access-control-request-method': 'POST' },
    });
    assert.equal(
      response.headers['access-control-allow-origin'],
      undefined,
      origin,
    );
  }
  const allowed = await app.inject({
    method: 'OPTIONS',
    url: '/api/auth/login',
    headers: {
      origin: 'https://app.example.test',
      'access-control-request-method': 'POST',
    },
  });
  assert.equal(
    allowed.headers['access-control-allow-origin'],
    'https://app.example.test',
  );
});

test('fila por usuário: serializa por chave e libera quem espera demais', async () => {
  const lock = createKeyedLock(60);
  const order: string[] = [];
  const slow = lock(
    'a',
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      order.push('lenta');
    },
    timeout,
  );
  const next = lock('a', async () => void order.push('segunda'), timeout);
  const other = lock('b', async () => void order.push('outra chave'), timeout);
  await Promise.all([slow, next, other]);
  assert.deepEqual(order, ['outra chave', 'lenta', 'segunda']);

  const blocker = lock(
    'c',
    () => new Promise((resolve) => setTimeout(resolve, 200)),
    timeout,
  );
  await assert.rejects(
    lock('c', async () => 1, () => new Error('esperou demais')),
    /esperou demais/,
  );
  await blocker;
});

test(
  'PostgreSQL: apagar a conta remove avatar, linhas e arquivos; trocar o avatar apaga o anterior',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const uploadDir = await mkdtemp(join(tmpdir(), 'fiscaliza-up-'));
    const previousDir = process.env.UPLOAD_DIR;
    process.env.UPLOAD_DIR = uploadDir;
    const app = await buildApp();
    const { db, pool } = database();
    t.after(async () => {
      if (previousDir === undefined) delete process.env.UPLOAD_DIR;
      else process.env.UPLOAD_DIR = previousDir;
      await app.close();
      await pool.end();
      await rm(uploadDir, { recursive: true, force: true });
    });
    const citizen = await createCitizen(app, db);

    const first = await uploadPhoto(app, citizen.headers);
    const second = await uploadPhoto(app, citizen.headers);
    const idOf = (url: string) => url.split('/').at(-1)!;
    assert.equal(await exists(join(uploadDir, idOf(first))), true);

    const setAvatar = (avatar: string) =>
      app.inject({
        method: 'PUT',
        url: '/api/profile/avatar',
        headers: citizen.headers,
        payload: { avatar },
      });
    assert.equal((await setAvatar(first)).statusCode, 200);
    assert.equal((await setAvatar(second)).statusCode, 200);
    assert.equal(await exists(join(uploadDir, idOf(first))), false);
    assert.equal(await exists(join(uploadDir, idOf(second))), true);
    const rows = await db
      .select()
      .from(attachments)
      .where(eq(attachments.ownerId, citizen.id));
    assert.deepEqual(
      rows.map((row) => row.id),
      [idOf(second)],
    );

    const removed = await app.inject({
      method: 'DELETE',
      url: '/api/profile',
      headers: citizen.headers,
    });
    assert.equal(removed.statusCode, 200, removed.body);
    assert.equal(
      (await db.select().from(users).where(eq(users.id, citizen.id))).length,
      0,
    );
    assert.equal(
      (
        await db
          .select()
          .from(attachments)
          .where(eq(attachments.ownerId, citizen.id))
      ).length,
      0,
    );
    assert.equal(await exists(join(uploadDir, idOf(second))), false);
  },
);

test(
  'PostgreSQL: o endpoint de teste de push não existe e requisições de notificação não vazam conexões',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const app = await buildApp();
    const { db, pool } = database();
    t.after(async () => {
      await app.close();
      await pool.end();
    });
    const citizen = await createCitizen(app, db);
    const sent = await app.inject({
      method: 'POST',
      url: '/api/v1/notifications/test',
      headers: citizen.headers,
      payload: { token: 'ExponentPushToken[abc]', title: 'x', body: 'y' },
    });
    assert.equal(sent.statusCode, 404);

    const connections = async () =>
      Number(
        (
          await pool.query(
            'SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname = current_database()',
          )
        ).rows[0].n,
      );
    const register = () =>
      app.inject({
        method: 'POST',
        url: '/api/v1/notifications/register-token',
        headers: citizen.headers,
        payload: { token: 'ExponentPushToken[vazamento-1]', platform: 'android' },
      });
    await register();
    const before = await connections();
    for (let i = 0; i < 30; i++) await register();
    const after = await connections();
    assert.ok(after <= before + 2, `conexões ${before} -> ${after}`);
  },
);

test('contrato OpenAPI gerado documenta conta, avisos e chamados salvos', async (t) => {
  const app = await buildApp();
  t.after(() => app.close());
  await app.ready();
  const paths = app.swagger().paths ?? {};
  for (const [path, method] of [
    ['/api/profile', 'delete'],
    ['/api/v1/notifications/register-token', 'post'],
    ['/api/v1/notifications/follow-call', 'delete'],
    ['/api/v1/saved-calls', 'get'],
    ['/api/v1/saved-calls/{callId}', 'put'],
  ] as const)
    assert.ok((paths as Record<string, Record<string, unknown>>)[path]?.[method], `${method} ${path}`);
  assert.equal((paths as Record<string, unknown>)['/api/v1/notifications/test'], undefined);
});
