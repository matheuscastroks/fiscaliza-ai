import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';
import { hashPassword, newToken, tokenHash } from '../src/auth.js';
import { officialRio, municipalityFromGeometry, type Geometry } from '../src/municipality.js';
import { users, records, municipalities, sessions } from '../src/schema.js';

test('PostgreSQL: civic scopes validate the session polygon and previous-city detail is participation-only',
  { skip: !process.env.DATABASE_URL }, async (t) => {
    assert.ok(process.env.DEMO_PASSWORD, 'Set DEMO_PASSWORD for isolated integration accounts.');
    const { db, pool } = database();
    const tag = randomUUID();
    const accounts = ['author', 'supporter', 'follower', 'respondent', 'outsider', 'staff'] as const;
    const ids = accounts.map((name) => `${tag}-${name}`);
    const recordIds: string[] = [];
    t.after(async () => {
      if (recordIds.length) await db.delete(records).where(inArray(records.id, recordIds));
      await db.delete(users).where(inArray(users.id, ids));
      await pool.end();
    });
    await db.insert(municipalities).values(await officialRio()).onConflictDoNothing();
    const otherId = '3550308';
    const geometry: Geometry = { type: 'Polygon', coordinates: [[[-47, -24], [-46, -24], [-46, -23], [-47, -23], [-47, -24]]] };
    await db.insert(municipalities).values({ id: otherId, geometry,
      data: municipalityFromGeometry(otherId, 'São Paulo', 'SP', geometry) }).onConflictDoNothing();
    const passwordHash = await hashPassword(process.env.DEMO_PASSWORD);
    await db.insert(users).values(accounts.map((name) => ({
      id: `${tag}-${name}`, name, email: `${tag}-${name}@test.invalid`,
      role: name === 'staff' ? 'staff' as const : 'citizen' as const,
      municipalityId: '3304557', passwordHash,
    })));
    const app = await buildApp();
    t.after(() => app.close());
    const headers: Record<string, { authorization: string }> = {};
    for (const name of accounts) {
      const login: { statusCode: number; body: string; json: () => any } = await app.inject({ method: 'POST', url: '/api/auth/login',
        payload: { email: `${tag}-${name}@test.invalid`, password: process.env.DEMO_PASSWORD } });
      assert.equal(login.statusCode, 200, login.body);
      headers[name] = { authorization: `Bearer ${login.json().data.token}` };
    }
    const create = async (payload: Record<string, unknown>, actor = 'author') => {
      const response = await app.inject({ method: 'POST', url: '/api/civic-items', headers: headers[actor],
        payload: { kind: 'proposal', title: 'Melhoria urbana', summary: 'Resumo', body: 'Descrição', ...payload } });
      if (response.statusCode === 200) recordIds.push(response.json().data.id);
      return response;
    };
    const municipality = await create({ territory: { scope: 'municipality' }, neighborhood: 'Bairro ignorado' });
    assert.equal(municipality.statusCode, 200, municipality.body);
    assert.equal(municipality.json().data.neighborhood, 'Todo o município');
    assert.equal(municipality.json().data.municipalityId, '3304557');
    const neighborhood = await create({ territory: { scope: 'neighborhood', neighborhood: '  Centro  ' } });
    assert.equal(neighborhood.statusCode, 200, neighborhood.body);
    assert.equal(neighborhood.json().data.neighborhood, 'Centro');
    assert.deepEqual(neighborhood.json().data.territory, { scope: 'neighborhood', neighborhood: 'Centro' });
    const location = { latitude: -22.904, longitude: -43.186, address: 'Praça' };
    const point = await create({ territory: { scope: 'location', neighborhood: 'Centro', location } });
    assert.equal(point.statusCode, 200, point.body);
    assert.deepEqual(point.json().data.territory.location, location);
    const legacy = await create({ neighborhood: 'Centro' });
    assert.equal(legacy.statusCode, 200, legacy.body);
    assert.equal(legacy.json().data.territory, undefined);
    for (const territory of [
      { scope: 'unknown' }, { scope: 'neighborhood', neighborhood: '   ' },
      { scope: 'location', neighborhood: 'Centro' },
      { scope: 'location', neighborhood: 'Centro', location: { latitude: -23.5, longitude: -46.5 } },
      // Inside Rio's bounds, but outside its actual municipal polygon.
      { scope: 'location', neighborhood: 'Centro', location: { latitude: -22.8, longitude: -43.15 } },
      { scope: 'location', neighborhood: 'Centro', location: { latitude: 91, longitude: 0 } },
      { scope: 'municipality', municipalityId: otherId },
    ]) assert.equal((await create({ territory })).statusCode, 400);
    assert.equal((await create({ territory: { scope: 'municipality' }, municipalityId: otherId })).statusCode, 400);
    const civicId = point.json().data.id;
    const patch = (payload: Record<string, unknown>, actor = 'staff') => app.inject({ method: 'PATCH',
      url: `/api/civic-items/${civicId}`, headers: headers[actor], payload });
    assert.equal((await patch({ territory: { scope: 'municipality' } }, 'author')).statusCode, 403);
    assert.equal((await patch({ territory: { scope: 'location', neighborhood: 'Centro',
      location: { latitude: -23.5, longitude: -46.5 } } })).statusCode, 400);
    assert.equal((await patch({ territory: { scope: 'municipality' } })).statusCode, 400);
    const updated = await patch({ territory: { scope: 'municipality' }, justification: 'Ampliar atendimento a todo o territorio.' });
    assert.equal(updated.statusCode, 200, updated.body);
    assert.equal(updated.json().data.history.length, 1);
    assert.equal(updated.json().data.history[0].actor, 'staff');
    assert.equal(updated.json().data.history[0].from, 'submitted');
    assert.equal(updated.json().data.history[0].to, 'submitted');
    assert.equal(updated.json().data.history[0].text, 'Ampliar atendimento a todo o territorio.');
    assert.equal(updated.json().data.neighborhood, 'Todo o município');
    const occurrence = await app.inject({ method: 'POST', url: '/api/occurrences', headers: headers.author,
      payload: { title: 'Poste apagado', description: 'Poste da praça apagado', category: 'lighting', location, images: [] } });
    assert.equal(occurrence.statusCode, 200, occurrence.body);
    const occurrenceId = occurrence.json().data.id;
    recordIds.push(occurrenceId);
    const consultation = await create({ kind: 'consultation', territory: { scope: 'municipality' },
      options: ['A', 'B'], closesAt: new Date(Date.now() + 86400000).toISOString() }, 'staff');
    assert.equal(consultation.statusCode, 200, consultation.body);
    const consultationId = consultation.json().data.id;
    for (const [actor, relation] of [['supporter', 'support'], ['follower', 'follow']] as const) {
      for (const [path, id] of [['occurrences', occurrenceId], ['civic-items', civicId]]) {
        assert.equal((await app.inject({ method: 'PUT', url: `/api/${path}/${id}/${relation}`, headers: headers[actor] })).statusCode, 200);
      }
    }
    assert.equal((await app.inject({ method: 'PUT', url: `/api/civic-items/${consultationId}/answer`,
      headers: headers.respondent, payload: { option: 1 } })).statusCode, 200);
    await db.update(users).set({ municipalityId: otherId }).where(inArray(users.id, ids));
    for (const actor of ['author', 'supporter', 'follower']) {
      for (const [path, id] of [['occurrences', occurrenceId], ['civic-items', civicId]]) {
        const historical = await app.inject({ url: `/api/activity/${path}/${id}`, headers: headers[actor] });
        assert.equal(historical.statusCode, 200, historical.body);
        assert.equal(historical.json().data.municipalityId, '3304557');
        assert.equal(historical.json().data['votes' in historical.json().data ? 'votes' : 'supports'], 1);
        assert.equal((await app.inject({ url: `/api/${path}/${id}`, headers: headers[actor] })).statusCode, 404);
        assert.equal((await app.inject({ method: 'PUT', url: `/api/${path}/${id}/support`, headers: headers[actor] })).statusCode, 404);
        assert.equal((await app.inject({ method: 'POST', url: `/api/${path}/${id}/comments`,
          headers: headers[actor], payload: { text: 'Não deve gravar' } })).statusCode, 404);
      }
    }
    const answered = await app.inject({ url: `/api/activity/civic-items/${consultationId}`, headers: headers.respondent });
    assert.equal(answered.statusCode, 200, answered.body);
    assert.equal(answered.json().data.myAnswer, 1);
    assert.deepEqual(answered.json().data.answerCounts, [0, 1]);
    assert.equal((await app.inject({ method: 'PUT', url: `/api/civic-items/${consultationId}/answer`,
      headers: headers.respondent, payload: { option: 0 } })).statusCode, 404);
    assert.equal((await patch({ territory: { scope: 'neighborhood', neighborhood: 'Centro' } })).statusCode, 404);
    for (const actor of ['outsider', 'staff']) {
      assert.equal((await app.inject({ url: `/api/activity/occurrences/${occurrenceId}`, headers: headers[actor] })).statusCode, 404);
      assert.equal((await app.inject({ url: `/api/activity/civic-items/${civicId}`, headers: headers[actor] })).statusCode, 404);
    }
    assert.equal((await app.inject({ url: `/api/activity/occurrences/${occurrenceId}` })).statusCode, 401);
    assert.equal((await app.inject({ url: `/api/activity/civic-items/${occurrenceId}`, headers: headers.author })).statusCode, 404);
    // Activity is tied to identity even while the profile has no current city.
    await db.update(users).set({ municipalityId: null }).where(eq(users.id, `${tag}-author`));
    assert.equal((await app.inject({ url: `/api/activity/occurrences/${occurrenceId}`, headers: headers.author })).statusCode, 200);
    assert.equal((await app.inject({ url: '/api/activity', headers: headers.author })).statusCode, 200);
  });

test('PostgreSQL: ten distinct staff can patch civic locations concurrently without exhausting the record pool',
  { skip: !process.env.DATABASE_URL, timeout: 60000 }, async (t) => {
    const { db, pool } = database();
    const tag = randomUUID();
    const staffIds = Array.from({ length: 10 }, (_, index) => `${tag}-concurrent-${index}`);
    const recordIds = staffIds.map((id) => `${id}-proposal`);
    const app = await buildApp();
    t.after(async () => {
      await app.close();
      await db.delete(records).where(inArray(records.id, recordIds));
      await db.delete(users).where(inArray(users.id, staffIds));
      await pool.end();
    });
    await db.insert(municipalities).values(await officialRio()).onConflictDoNothing();
    await db.insert(users).values(staffIds.map((id) => ({ id, name: id, email: `${id}@test.invalid`,
      role: 'staff' as const, passwordHash: 'unused-for-injected-test-session', municipalityId: '3304557' })));
    const tokens = staffIds.map(() => newToken());
    await db.insert(sessions).values(tokens.map((token, index) => ({ tokenHash: tokenHash(token),
      userId: staffIds[index], expiresAt: new Date(Date.now() + 60000) })));
    await db.insert(records).values(recordIds.map((id, index) => ({ id, kind: 'proposal',
      municipalityId: '3304557', authorId: staffIds[index], data: {
        id, kind: 'proposal' as const, municipalityId: '3304557', title: 'Local de atendimento',
        summary: 'Escopo da proposta', body: 'Ajustar o local de atendimento.', neighborhood: 'Todo o município',
        territory: { scope: 'municipality' as const }, createdBy: staffIds[index],
        createdAt: new Date().toISOString(), responsible: 'Obras', comments: [], supports: 0,
        linkedIds: [], status: 'submitted' as const,
      } })));
    const responses = await Promise.all(recordIds.map((id, index) => app.inject({ method: 'PATCH',
      url: `/api/civic-items/${id}`, headers: { authorization: `Bearer ${tokens[index]}` }, payload: {
        territory: { scope: 'location', neighborhood: 'Centro', location: { latitude: -22.904, longitude: -43.186 } },
        justification: 'Concentrar o atendimento na praca informada.',
      } })));
    for (const response of responses) {
      assert.equal(response.statusCode, 200, response.body);
      assert.equal(response.json().data.territory.scope, 'location');
      assert.equal(response.json().data.history.length, 1);
    }
  });
