import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';
import { hashPassword } from '../src/auth.js';
import { seedBase } from '../src/seed-base.js';
import { officialRio } from '../src/municipality.js';
import { users } from '../src/schema.js';

test('demo media: public JPEG allowlist rejects other files and encoded traversal', async (t) => {
  const app = await buildApp();
  t.after(() => app.close());
  for (const name of [
    'avatar-ana.jpg',
    'avatar-gestao.jpg',
    'avatar-admin.jpg',
  ]) {
    const response = await app.inject({
      method: 'GET',
      url: `/api/demo-media/${name}`,
    });
    assert.equal(response.statusCode, 200, response.body);
    assert.match(response.headers['content-type']!, /^image\/jpeg/);
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.deepEqual(
      response.rawPayload,
      await readFile(resolve('data/demo-media', name)),
    );
  }
  for (const name of [
    'README.md',
    'Lighting.jpg',
    'unknown.jpg',
    'lighting.jpg',
    'legacy-light-1.jpg',
    '..%2F3304557.geojson',
    '%2e%2e%5c3304557.geojson',
  ]) {
    const response = await app.inject({
      method: 'GET',
      url: `/api/demo-media/${name}`,
    });
    assert.equal(response.statusCode, 404, `${name}: ${response.body}`);
  }
});

test(
  'PostgreSQL: seeded portraits are exposed in login and never replace existing avatars',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { db, pool } = database();
    const app = await buildApp();
    t.after(async () => {
      await app.close();
      await pool.end();
    });
    await seedBase(db, await officialRio(), await hashPassword(process.env.DEMO_PASSWORD || 'Fiscaliza123!'));
    for (const [id, email, file] of [
      ['citizen-ana', 'beatrizarante@gmail.com', 'avatar-ana.jpg'],
      ['staff-gestao', 'gestao@vilaesperanca.exemplo', 'avatar-gestao.jpg'],
      ['admin-local', 'admin@vilaesperanca.exemplo', 'avatar-admin.jpg'],
    ]) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email,
          password: process.env.DEMO_PASSWORD || 'Fiscaliza123!',
        },
      });
      assert.equal(response.statusCode, 200, response.body);
      const user = response.json().data.user;
      assert.equal(user.id, id);
      assert.equal(user.avatar, '/api/demo-media/' + file);
      assert.equal(user.passwordHash, undefined);
    }
    const [ana] = await db
      .select()
      .from(users)
      .where(eq(users.id, 'citizen-ana'));
    try {
      await db
        .update(users)
        .set({ avatar: '/api/demo-media/avatar-admin.jpg' })
        .where(eq(users.id, ana.id));
      await seedBase(db, await officialRio(), await hashPassword(process.env.DEMO_PASSWORD || 'Fiscaliza123!'));
      const [kept] = await db.select().from(users).where(eq(users.id, ana.id));
      assert.equal(kept.avatar, '/api/demo-media/avatar-admin.jpg');
    } finally {
      await db
        .update(users)
        .set({ avatar: ana.avatar })
        .where(eq(users.id, ana.id));
    }
  },
);
