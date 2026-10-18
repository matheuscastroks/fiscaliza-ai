import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';
import { seed } from '../src/seed-data.js';
import {
  users,
  records,
  municipalities,
  attachments,
  relations,
  postalCodes,
} from '../src/schema.js';
import {
  containsPoint,
  parseGeometry,
  municipalityFromGeometry,
  type Geometry,
} from '../src/municipality.js';
const shape: Geometry = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ],
    [
      [3, 3],
      [7, 3],
      [7, 7],
      [3, 7],
      [3, 3],
    ],
  ],
};
test('municipal geography handles boundary, holes and MultiPolygon without bounding-box acceptance', () => {
  assert.equal(containsPoint(shape, 1, 1), true);
  assert.equal(containsPoint(shape, 5, 5), false);
  assert.equal(containsPoint(shape, 3, 5), true);
  assert.equal(containsPoint(shape, 0, 5), true);
  assert.equal(containsPoint(shape, 11, 5), false);
  const multi: Geometry = {
    type: 'MultiPolygon',
    coordinates: [
      shape.coordinates,
      [
        [
          [20, 20],
          [21, 20],
          [21, 21],
          [20, 21],
          [20, 20],
        ],
      ],
    ],
  };
  assert.equal(containsPoint(multi, 20.5, 20.5), true);
  assert.equal(containsPoint(multi, 15, 15), false);
  assert.throws(
    () => parseGeometry({ type: 'Polygon', coordinates: [] }),
    /municipal/,
  );
});
test(
  'PostgreSQL: CEP onboarding, tenant isolation, residence change and scoped presentation reset',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { db, pool } = database();
    t.after(() => pool.end());
    await seed(db);
    await db
      .update(users)
      .set({ municipalityId: null, postalCode: null, neighborhood: null })
      .where(eq(users.id, 'citizen-ana'));
    await db.delete(postalCodes).where(eq(postalCodes.postalCode, '12345678'));
    await db.delete(postalCodes).where(eq(postalCodes.postalCode, '20010000'));
    const otherId = '3550308';
    const geometry: Geometry = {
      type: 'Polygon',
      coordinates: [
        [
          [-47, -24],
          [-46, -24],
          [-46, -23],
          [-47, -23],
          [-47, -24],
        ],
      ],
    };
    await db
      .insert(municipalities)
      .values({
        id: otherId,
        data: municipalityFromGeometry(otherId, 'Sao Paulo', 'SP', geometry),
        geometry,
      })
      .onConflictDoNothing();
    let calls = 0;
    const app = await buildApp({
      fetch: async (input) => {
        calls++;
        const url = String(input);
        if (url.includes('/00000000/')) return Response.json({ erro: 'true' });
        if (url.includes('/99999999/')) throw new Error('offline');
        if (url.includes('/12345678/'))
          return Response.json({
            cep: '12345-678',
            ibge: otherId,
            localidade: 'Sao Paulo',
            uf: 'SP',
            bairro: 'Centro SP',
            logradouro: 'Rua SP',
          });
        return Response.json({
          cep: '20010-000',
          ibge: '3304557',
          localidade: 'Rio de Janeiro',
          uf: 'RJ',
          bairro: 'Centro',
          logradouro: 'Rua RJ',
        });
      },
    });
    t.after(() => app.close());
    const login = async (email: string) => {
      const r = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email, password: 'Fiscaliza123!' },
      });
      assert.equal(r.statusCode, 200, r.body);
      return { authorization: `Bearer ${r.json().data.token}` };
    };
    const citizen = await login('ana@vilaesperanca.exemplo'),
      staff = await login('gestao@vilaesperanca.exemplo'),
      admin = await login('admin@vilaesperanca.exemplo');
    const request = (
      method: 'GET' | 'POST' | 'PUT' | 'PATCH',
      url: string,
      payload?: Record<string, unknown>,
      headers = citizen,
    ) => app.inject({ method, url, payload, headers });
    assert.equal((await request('GET', '/api/occurrences')).statusCode, 403);
    assert.equal(
      (await request('GET', '/api/auth/me')).json().data.municipality,
      null,
    );
    assert.equal(
      (await request('GET', '/api/profile/postal-code/abc')).statusCode,
      400,
    );
    assert.equal(
      (await request('GET', '/api/profile/postal-code/00000000')).statusCode,
      404,
    );
    assert.equal(
      (await request('GET', '/api/profile/postal-code/99999999')).statusCode,
      503,
    );
    const lookup = await request('GET', '/api/profile/postal-code/20010-000');
    assert.equal(lookup.json().data.municipality.id, '3304557');
    const priorCalls = calls;
    assert.equal(
      (await request('GET', '/api/profile/postal-code/20010000')).statusCode,
      200,
    );
    assert.equal(calls, priorCalls);
    assert.equal(
      (
        await request('PUT', '/api/profile/municipality', {
          postalCode: '20010000',
          municipalityId: otherId,
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (
        await request(
          'PUT',
          '/api/profile/municipality',
          { postalCode: '20010000', municipalityId: '3304557' },
          staff,
        )
      ).statusCode,
      403,
    );
    for (let i = 0; i < 2; i++) {
      const r = await request('PUT', '/api/profile/municipality', {
        postalCode: '20010000',
        municipalityId: '3304557',
      });
      assert.equal(r.statusCode, 200, r.body);
      assert.equal(r.json().data.neighborhood, 'Centro');
    }
    assert.equal(
      (await request('GET', '/api/municipality')).json().data.id,
      '3304557',
    );
    const payload = {
      title: 'Territorial test',
      description: 'Local teste',
      category: 'road',
      location: { latitude: -22.904, longitude: -43.186, address: 'Rio' },
    };
    assert.equal(
      (
        await request('POST', '/api/occurrences', {
          ...payload,
          municipalityId: otherId,
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (
        await request('POST', '/api/occurrences', {
          ...payload,
          location: {
            ...payload.location,
            latitude: -23.55,
            longitude: -46.63,
          },
        })
      ).statusCode,
      400,
    );
    const created = await request('POST', '/api/occurrences', payload);
    assert.equal(created.statusCode, 200, created.body);
    const ownId = created.json().data.id;
    assert.equal(created.json().data.municipalityId, '3304557');
    await db
      .insert(records)
      .values({
        id: 'other-city-occurrence',
        municipalityId: otherId,
        kind: 'occurrence',
        authorId: 'citizen-ana',
        data: {
          ...created.json().data,
          id: 'other-city-occurrence',
          municipalityId: otherId,
          location: { latitude: -23.5, longitude: -46.5, address: 'SP' },
        },
      })
      .onConflictDoNothing();
    await db
      .insert(attachments)
      .values({
        id: '00000000-0000-4000-8000-000000000001',
        municipalityId: otherId,
        mime: 'image/webp',
        ownerId: 'citizen-ana',
      })
      .onConflictDoNothing();
    await db
      .insert(relations)
      .values({
        recordId: 'other-city-occurrence',
        userId: 'citizen-ana',
        kind: 'support',
      })
      .onConflictDoNothing();
    const [sourceCivic] = await db
      .select()
      .from(records)
      .where(eq(records.id, 'consultation-praca'));
    const foreignCivic = structuredClone(sourceCivic.data);
    foreignCivic.id = 'other-city-consultation';
    foreignCivic.municipalityId = otherId;
    if ('kind' in foreignCivic) foreignCivic.linkedIds = [ownId];
    await db
      .insert(records)
      .values({
        id: foreignCivic.id,
        municipalityId: otherId,
        kind: 'consultation',
        authorId: 'staff-gestao',
        data: foreignCivic,
      })
      .onConflictDoNothing();
    assert.equal(
      (await request('GET', '/api/civic-items/other-city-consultation'))
        .statusCode,
      404,
    );
    assert.equal(
      (
        await request(
          'PUT',
          '/api/civic-items/other-city-consultation/answer',
          { option: 0 },
        )
      ).statusCode,
      404,
    );
    assert.equal(
      (
        await request(
          'PATCH',
          '/api/civic-items/other-city-consultation',
          { status: 'closed', result: 'foreign' },
          staff,
        )
      ).statusCode,
      404,
    );
    assert.ok(
      !(await request('GET', `/api/occurrences/${ownId}`))
        .json()
        .data.relatedIds.includes('other-city-consultation'),
    );
    assert.equal(
      (await request('GET', '/api/occurrences/other-city-occurrence'))
        .statusCode,
      404,
    );
    assert.equal(
      (await request('PUT', '/api/occurrences/other-city-occurrence/support'))
        .statusCode,
      404,
    );
    assert.equal(
      (
        await request(
          'POST',
          '/api/occurrences/other-city-occurrence/comments',
          { text: 'foreign' },
        )
      ).statusCode,
      404,
    );
    assert.equal(
      (
        await request(
          'POST',
          '/api/occurrences/other-city-occurrence/transitions',
          { status: 'in_progress', justification: 'foreign' },
          staff,
        )
      ).statusCode,
      404,
    );
    assert.equal(
      (
        await request('POST', '/api/occurrences', {
          ...payload,
          images: ['/api/attachments/00000000-0000-4000-8000-000000000001'],
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (
        await request('POST', '/api/civic-items', {
          kind: 'proposal',
          title: 'foreign link',
          summary: 'summary',
          body: 'body',
          neighborhood: 'Centro',
          linkedIds: ['other-city-occurrence'],
        })
      ).statusCode,
      404,
    );
    assert.ok(
      (await request('GET', '/api/occurrences'))
        .json()
        .data.every((v: any) => v.municipalityId === '3304557'),
    );
    assert.ok(
      (await request('GET', '/api/duplicates?description=Territorial'))
        .json()
        .data.every((v: any) => v.municipalityId === '3304557'),
    );
    const before = (await request('GET', '/api/overview')).json().data
      .occurrences;
    assert.equal(
      before,
      (
        await db
          .select()
          .from(records)
          .where(eq(records.municipalityId, '3304557'))
      ).filter((v) => v.kind === 'occurrence').length,
    );
    const [concurrentCreate, changed] = await Promise.all([
      request('POST', '/api/occurrences', payload),
      request('PUT', '/api/profile/municipality', {
        postalCode: '12345678',
        municipalityId: otherId,
      }),
    ]);
    assert.ok([200, 400].includes(concurrentCreate.statusCode));
    if (concurrentCreate.statusCode === 200)
      assert.equal(concurrentCreate.json().data.municipalityId, '3304557');
    assert.equal(changed.statusCode, 200, changed.body);
    assert.equal(
      (await request('GET', `/api/occurrences/${ownId}`)).statusCode,
      404,
    );
    assert.equal(
      (await request('PUT', `/api/occurrences/${ownId}/support`)).statusCode,
      404,
    );
    assert.ok(
      (await request('GET', '/api/activity'))
        .json()
        .data.occurrences.some((v: any) => v.id === ownId),
    );
    assert.equal(
      (await request('POST', '/api/occurrences', payload)).statusCode,
      400,
    );
    const reset = await request(
      'POST',
      '/api/presentation/reset',
      { scenario: 'registered' },
      admin,
    );
    assert.equal(reset.statusCode, 200, reset.body);
    assert.equal(
      (
        await db
          .select()
          .from(records)
          .where(eq(records.id, 'other-city-occurrence'))
      ).length,
      1,
    );
    assert.equal(
      (
        await db
          .select()
          .from(relations)
          .where(eq(relations.recordId, 'other-city-occurrence'))
      ).length,
      1,
    );
    assert.equal(
      (
        await db
          .select()
          .from(attachments)
          .where(eq(attachments.id, '00000000-0000-4000-8000-000000000001'))
      ).length,
      1,
    );
    await db
      .update(users)
      .set({ municipalityId: otherId })
      .where(eq(users.id, 'admin-local'));
    assert.equal(
      (
        await request(
          'POST',
          '/api/presentation/reset',
          { scenario: 'registered' },
          admin,
        )
      ).statusCode,
      409,
    );
    await db
      .update(users)
      .set({ municipalityId: '3304557' })
      .where(eq(users.id, 'admin-local'));
    await request('PUT', '/api/profile/municipality', {
      postalCode: '20010000',
      municipalityId: '3304557',
    });
  },
);
