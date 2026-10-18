import { uploadExamplePhoto } from './upload-photo.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { database } from '../src/db.js';
import { buildApp } from '../src/app.js';
import { seed } from '../src/seed-data.js';
import {
  users,
  sessions,
  relations,
  municipalities,
  records,
  attachments,
} from '../src/schema.js';
import { newToken, tokenHash } from '../src/auth.js';

test(
  'PostgreSQL: unique views are tenant-scoped, survive refetch and do not create participation',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { db, pool } = database();
    const savedKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = '';
    t.after(() => {
      if (savedKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = savedKey;
    });
    const app = await buildApp();
    const ids = [0, 1, 2].map(() => 'viewer-' + randomUUID());
    const other = '9999994';
    const created: string[] = [];
    t.after(async () => {
      await app.close();
      if (created.length)
        await db.delete(records).where(inArray(records.id, created));
      await db.delete(attachments).where(inArray(attachments.ownerId, ids));
      await db.delete(relations).where(inArray(relations.userId, ids));
      await db.delete(users).where(inArray(users.id, ids));
      await db.delete(municipalities).where(eq(municipalities.id, other));
      await pool.end();
    });
    await seed(db);
    await pool.query(
      "INSERT INTO municipalities(id,data,geometry) SELECT $1,jsonb_set(data,'{id}',to_jsonb($1::text)),geometry FROM municipalities WHERE id='3304557' ON CONFLICT DO NOTHING",
      [other],
    );
    await db.insert(users).values(
      ids.map((id, i) => ({
        id,
        name: 'Viewer',
        email: id + '@test.invalid',
        role: 'citizen' as const,
        passwordHash: 'unused',
        municipalityId: i === 2 ? other : '3304557',
      })),
    );
    const headers: { authorization: string }[] = [];
    for (const id of ids) {
      const token = newToken();
      await db.insert(sessions).values({
        tokenHash: tokenHash(token),
        userId: id,
        expiresAt: new Date(Date.now() + 120000),
      });
      headers.push({ authorization: 'Bearer ' + token });
    }
    for (const path of [
      '/api/occurrences/occ-iluminacao-centro',
      '/api/civic-items/proposal-praca',
    ]) {
      const initial = await app.inject({
        method: 'GET',
        url: path,
        headers: headers[0],
      });
      const count = initial.json().data.views || 0;
      assert.ok(count >= 128, 'seeded views are persisted independently');
      const baselineSupports =
        initial.json().data.votes ?? initial.json().data.supports;
      assert.ok(baselineSupports > 0);
      const seen = await app.inject({
        method: 'PUT',
        url: path + '/view',
        headers: headers[0],
      });
      assert.equal(seen.statusCode, 200, seen.body);
      assert.equal(seen.json().data.views, count + 1);
      const repeats = await Promise.all(
        Array.from({ length: 4 }, () =>
          app.inject({
            method: 'PUT',
            url: path + '/view',
            headers: headers[0],
          }),
        ),
      );
      for (const r of repeats) {
        assert.equal(r.statusCode, 200);
        assert.equal(r.json().data.views, count + 1);
      }
      const second = await app.inject({
        method: 'PUT',
        url: path + '/view',
        headers: headers[1],
      });
      assert.equal(second.json().data.views, count + 2);
      const loaded = await app.inject({
        method: 'GET',
        url: path,
        headers: headers[0],
      });
      assert.equal(loaded.json().data.views, count + 2);
      assert.equal(
        (
          await app.inject({
            method: 'PUT',
            url: path + '/view',
            headers: headers[2],
          })
        ).statusCode,
        404,
      );
      assert.equal(
        (await app.inject({ method: 'PUT', url: path + '/view' })).statusCode,
        401,
      );
      const support = await app.inject({
        method: 'PUT',
        url: path + '/support',
        headers: headers[0],
      });
      assert.equal(support.json().data.views, count + 2);
      assert.equal(support.json().data.supportedByMe, true);
      assert.equal(
        support.json().data.votes ?? support.json().data.supports,
        baselineSupports + 1,
      );
      await app.inject({
        method: 'DELETE',
        url: path + '/support',
        headers: headers[0],
      });
    }
    const activity = await app.inject({
      method: 'GET',
      url: '/api/activity',
      headers: headers[0],
    });
    assert.deepEqual(activity.json().data, { occurrences: [], items: [] });
    const payload = {
      title: 'Calçada com piso solto',
      description: 'O piso solto dificulta a passagem.',
      category: 'road',
      location: {
        latitude: -22.904,
        longitude: -43.186,
        address: 'Praça Central',
        neighborhood: 'Centro',
      },
    };
    for (const images of [
      undefined,
      [],
      ['/api/demo-media/lighting.jpg'],
      ['/api/attachments/00000000-0000-4000-8000-000000000000'],
    ]) {
      const rejected = await app.inject({
        method: 'POST',
        url: '/api/occurrences',
        headers: headers[0],
        payload: { ...payload, ...(images === undefined ? {} : { images }) },
      });
      assert.equal(rejected.statusCode, 400, rejected.body);
    }
    const strangerPhoto = await uploadExamplePhoto(app, headers[1]);
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/api/occurrences',
          headers: headers[0],
          payload: { ...payload, images: [strangerPhoto] },
        })
      ).statusCode,
      400,
    );
    const deniedAnalysis = await app.inject({
      method: 'POST',
      url: '/api/analysis',
      headers: headers[0],
      payload: { description: '', imageUrl: strangerPhoto },
    });
    assert.equal(deniedAnalysis.statusCode, 400, deniedAnalysis.body);
    const ownPhoto = await uploadExamplePhoto(app, headers[0]);
    const acceptedAnalysis = await app.inject({
      method: 'POST',
      url: '/api/analysis',
      headers: headers[0],
      payload: { description: '', imageUrl: ownPhoto },
    });
    assert.equal(acceptedAnalysis.statusCode, 200, acceptedAnalysis.body);
    assert.equal(acceptedAnalysis.json().data.imageAnalyzed, false);
    for (const imageUrl of [
      'https://example.org/photo.jpg',
      '/api/demo-media/lighting.jpg',
      '../../private',
    ]) {
      assert.equal(
        (
          await app.inject({
            method: 'POST',
            url: '/api/analysis',
            headers: headers[0],
            payload: { description: '', imageUrl },
          })
        ).statusCode,
        400,
      );
    }
    const saved = await app.inject({
      method: 'POST',
      url: '/api/occurrences',
      headers: headers[0],
      payload: { ...payload, images: [ownPhoto] },
    });
    assert.equal(saved.statusCode, 200, saved.body);
    created.push(saved.json().data.id);
    const reopened = await app.inject({
      method: 'GET',
      url: '/api/occurrences/' + saved.json().data.id,
      headers: headers[0],
    });
    assert.deepEqual(reopened.json().data.images, [ownPhoto]);
    const recordId = saved.json().data.id;
    await pool.query(
      "UPDATE records SET data=jsonb_set(data,'{status}','\"resolved\"'::jsonb) WHERE id=$1",
      [recordId],
    );
    for (const rating of [0, 6, 2.5]) {
      const rejected = await app.inject({
        method: 'POST',
        url: '/api/occurrences/' + recordId + '/evaluation',
        headers: headers[0],
        payload: { rating, satisfied: true, reason: '' },
      });
      assert.equal(rejected.statusCode, 400, rejected.body);
    }
    const evaluation = { rating: 2, satisfied: false, reason: '' };
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/api/occurrences/' + recordId + '/evaluation',
          headers: headers[1],
          payload: evaluation,
        })
      ).statusCode,
      403,
    );
    const rated = await app.inject({
      method: 'POST',
      url: '/api/occurrences/' + recordId + '/evaluation',
      headers: headers[0],
      payload: evaluation,
    });
    assert.equal(rated.statusCode, 200, rated.body);
    assert.equal(rated.json().data.evaluation.rating, 2);
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/api/occurrences/' + recordId + '/evaluation',
          headers: headers[0],
          payload: evaluation,
        })
      ).statusCode,
      409,
    );
    const ratedAgain = await app.inject({
      url: '/api/occurrences/' + recordId,
      headers: headers[0],
    });
    assert.equal(ratedAgain.json().data.evaluation.rating, 2);

    assert.equal(
      (
        await app.inject({
          method: 'PUT',
          url: '/api/civic-items/consultation-praca/view',
          headers: headers[0],
        })
      ).statusCode,
      400,
    );
  },
);
