import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { ipInTrustedList, rateLimitKey } from '../src/client-ip.js';
import { database } from '../src/db.js';
import { applyMigrations } from '../src/migrations.js';
import { removeOrphanAttachments } from '../src/orphans.js';
import { attachments, users } from '../src/schema.js';
import { createCitizen } from './helpers.js';

const exists = (path: string) => access(path).then(() => true, () => false);

test('cabeçalhos de segurança de uma API JSON, sem HSTS', async (t) => {
  const app = await buildApp();
  t.after(() => app.close());
  const response = await app.inject('/health');
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['referrer-policy'], 'no-referrer');
  assert.match(String(response.headers['content-security-policy']), /frame-ancestors 'none'/);
  assert.equal(response.headers['strict-transport-security'], undefined);
});

test('IP do limite de requisições: só confia no cabeçalho da Cloudflare vindo do túnel', () => {
  assert.equal(ipInTrustedList('172.30.97.5', ['172.30.97.0/24']), true);
  assert.equal(ipInTrustedList('::ffff:172.30.97.5', ['172.30.97.0/24']), true);
  assert.equal(ipInTrustedList('203.0.113.9', ['172.30.97.0/24']), false);
  const key = rateLimitKey(['172.30.97.0/24']);
  const request = (remote: string, header?: string) =>
    ({
      headers: header ? { 'cf-connecting-ip': header } : {},
      socket: { remoteAddress: remote },
      ip: remote,
    }) as never;
  assert.equal(key(request('172.30.97.5', '198.51.100.7')), '198.51.100.7');
  // conexão que não vem do túnel não pode forjar o IP
  assert.equal(key(request('203.0.113.9', '198.51.100.7')), '203.0.113.9');
  assert.equal(key(request('172.30.97.5', 'não-é-ip')), '172.30.97.5');
  assert.equal(rateLimitKey(false)(request('172.30.97.5', '198.51.100.7')), '172.30.97.5');
});

test(
  'PostgreSQL: fotos sem uso há mais de um dia são apagadas; avatar e fotos recentes ficam',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const dir = await mkdtemp(join(tmpdir(), 'fiscaliza-orf-'));
    const app = await buildApp();
    const { db, pool } = database();
    t.after(async () => {
      await app.close();
      await pool.end();
      await rm(dir, { recursive: true, force: true });
    });
    await applyMigrations(pool);
    const citizen = await createCitizen(app, db);
    const old = new Date(Date.now() - 3 * 86400000);
    const make = async (id: string, createdAt: Date) => {
      await db.insert(attachments).values({ id, municipalityId: '3304557', mime: 'image/webp', ownerId: citizen.id, createdAt });
      await writeFile(join(dir, id), 'x');
    };
    const avatar = randomUUID();
    const orphan = randomUUID();
    const recent = randomUUID();
    await make(avatar, old);
    await make(orphan, old);
    await make(recent, new Date());
    await db.update(users).set({ avatar: `/api/attachments/${avatar}` }).where(eq(users.id, citizen.id));

    assert.ok((await removeOrphanAttachments(db, dir)) >= 1);
    assert.equal(await exists(join(dir, orphan)), false);
    assert.equal(await exists(join(dir, avatar)), true);
    assert.equal(await exists(join(dir, recent)), true);
  },
);
