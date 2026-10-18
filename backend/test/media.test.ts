import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { eq, inArray } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';
import { hashPassword, newToken, tokenHash } from '../src/auth.js';
import { seed } from '../src/seed-data.js';
import {
  attachments,
  municipalities,
  records,
  relations,
  sessions,
  users,
} from '../src/schema.js';
import type { Proposal } from '../../shared/contracts.js';

test('demo media: public JPEG allowlist rejects other files and encoded traversal', async (t) => {
  const app = await buildApp();
  t.after(() => app.close());
  for (const name of [
    'lighting.jpg',
    'road.jpg',
    'waste.jpg',
    'crossing.jpg',
    'gloria-dark.jpg',
    'gloria-light.jpg',
    'park-shade.jpg',
    'park-path.jpg',
    'recycling.jpg',
    'accessible-path.jpg',
    'crossing-day.jpg',
    'legacy-light-1.jpg',
    'legacy-light-2.jpg',
    'legacy-light-3.jpg',
    'legacy-light-4.jpg',
    'benches.jpg',
    'sidewalk.jpg',
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
  'PostgreSQL: proposal photos enforce ownership, municipality, type and count; seed only fills empty media',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { db, pool } = database();
    const tag = randomUUID();
    const owner = `media-owner-${tag}`;
    const stranger = `media-stranger-${tag}`;
    const otherCity = '9999996'; // Synthetic seven-digit IBGE code in the isolated test database.
    const created: string[] = [];
    const attachmentIds = Array.from({ length: 3 }, () => randomUUID());
    const seedIds = [
      'occ-iluminacao-centro',
      'proposal-praca',
      'proposal-travessia',
      'action-calcadas',
    ];
    await seed(db);
    const snapshots = await db
      .select()
      .from(records)
      .where(inArray(records.id, seedIds));
    t.after(async () => {
      if (created.length)
        await db.delete(records).where(inArray(records.id, created));
      await db.delete(relations).where(eq(relations.userId, owner));
      for (const row of snapshots)
        await db
          .update(records)
          .set({ data: row.data })
          .where(eq(records.id, row.id));
      await db
        .delete(attachments)
        .where(inArray(attachments.id, attachmentIds));
      await db.delete(users).where(inArray(users.id, [owner, stranger]));
      await db.delete(municipalities).where(eq(municipalities.id, otherCity));
      await pool.end();
    });
    const [rio] = await db
      .select()
      .from(municipalities)
      .where(eq(municipalities.id, '3304557'));
    await db
      .insert(municipalities)
      .values({ ...rio, id: otherCity, data: { ...rio.data, id: otherCity } });
    const passwordHash = await hashPassword('Media-test123!');
    await db.insert(users).values(
      [owner, stranger].map((id) => ({
        id,
        name: id,
        email: `${id}@test.invalid`,
        role: 'staff' as const,
        municipalityId: '3304557',
        passwordHash,
      })),
    );
    const token = newToken();
    await db.insert(sessions).values({
      tokenHash: tokenHash(token),
      userId: owner,
      expiresAt: new Date(Date.now() + 60_000),
    });
    await db.insert(attachments).values(
      attachmentIds.map((id, index) => ({
        id,
        mime: 'image/webp',
        ownerId: index === 1 ? stranger : owner,
        municipalityId: index === 2 ? otherCity : '3304557',
      })),
    );
    const app = await buildApp();
    t.after(() => app.close());
    const headers = { authorization: `Bearer ${token}` };
    const url = (id: string) => `/api/attachments/${id}`;
    const create = async (extra: Record<string, unknown>) => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/civic-items',
        headers,
        payload: {
          kind: 'proposal',
          title: 'Bancos na praça',
          summary: 'Assentos acessíveis',
          body: 'Instalar bancos.',
          territory: { scope: 'municipality' },
          ...extra,
        },
      });
      if (response.statusCode === 200) created.push(response.json().data.id);
      return response;
    };
    const accepted = await create({ images: [url(attachmentIds[0])] });
    assert.equal(accepted.statusCode, 200, accepted.body);
    assert.deepEqual(accepted.json().data.images, [url(attachmentIds[0])]);
    const detail = await app.inject({
      method: 'GET',
      url: `/api/civic-items/${accepted.json().data.id}`,
      headers,
    });
    assert.deepEqual(detail.json().data.images, [url(attachmentIds[0])]);
    for (const images of [
      [url(attachmentIds[1])],
      [url(attachmentIds[2])],
      [url(randomUUID())],
      ['https://example.org/photo.jpg'],
      ['/api/demo-media/benches.jpg'],
      ['file:///private.jpg'],
      Array.from({ length: 6 }, () => url(attachmentIds[0])),
    ]) {
      const response = await create({ images });
      assert.equal(response.statusCode, 400, response.body);
    }
    for (const kind of ['consultation', 'action']) {
      const response = await create({
        kind,
        images: [url(attachmentIds[0])],
        dueAt: '2099-01-01T00:00:00Z',
        closesAt: '2099-01-01T00:00:00Z',
        options: ['Sim', 'Não'],
      });
      assert.equal(response.statusCode, 400, response.body);
    }
    const legacy = await create({});
    assert.equal(legacy.statusCode, 200, legacy.body);
    const [ordinaryBefore] = await db
      .select()
      .from(records)
      .where(eq(records.id, legacy.json().data.id));
    const maximum = await create({
      images: Array.from({ length: 5 }, () => url(attachmentIds[0])),
    });
    assert.equal(maximum.statusCode, 200, maximum.body);

    const plaza = snapshots.find((row) => row.id === 'proposal-praca')!;
    const changed: Proposal = {
      ...(plaza.data as Proposal),
      images: [],
      status: 'declined',
      decision: 'Decisão preservada',
      supports: 17,
    };
    await db
      .update(records)
      .set({ data: changed })
      .where(eq(records.id, plaza.id));
    const crossing = snapshots.find((row) => row.id === 'proposal-travessia')!;
    const uploaded = {
      ...(crossing.data as Proposal),
      images: [url(attachmentIds[0])],
    };
    await db
      .update(records)
      .set({ data: uploaded })
      .where(eq(records.id, crossing.id));
    await pool.query(
      "UPDATE records SET data = data - 'images' WHERE id = 'occ-iluminacao-centro'",
    );
    await pool.query(
      "UPDATE records SET data = jsonb_set(data, '{evidence}', 'null') WHERE id = 'action-calcadas'",
    );
    await db
      .insert(relations)
      .values({ recordId: plaza.id, userId: owner, kind: 'support' });
    await seed(db);
    await seed(db);
    const [filled] = await db
      .select()
      .from(records)
      .where(eq(records.id, plaza.id));
    assert.deepEqual(filled.data, {
      ...changed,
      images: ['/api/demo-media/park-shade.jpg'],
    });
    const [preserved] = await db
      .select()
      .from(records)
      .where(eq(records.id, crossing.id));
    assert.deepEqual(preserved.data, uploaded);
    assert.equal(
      (await db.select().from(relations).where(eq(relations.userId, owner)))
        .length,
      1,
    );
    const [occurrence] = await db
      .select()
      .from(records)
      .where(eq(records.id, 'occ-iluminacao-centro'));
    assert.deepEqual(occurrence.data, {
      ...snapshots.find((row) => row.id === occurrence.id)!.data,
      images: ['/api/demo-media/lighting.jpg'],
    });
    const [action] = await db
      .select()
      .from(records)
      .where(eq(records.id, 'action-calcadas'));
    assert.deepEqual(action.data, {
      ...snapshots.find((row) => row.id === action.id)!.data,
      evidence: ['/api/demo-media/sidewalk.jpg'],
    });
    const [ordinary] = await db
      .select()
      .from(records)
      .where(eq(records.id, legacy.json().data.id));
    assert.deepEqual(ordinary.data, ordinaryBefore.data);
  },
);

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
    await seed(db);
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
      await seed(db);
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
