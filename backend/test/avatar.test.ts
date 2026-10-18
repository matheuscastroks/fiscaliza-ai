import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';
import { seed } from '../src/seed-data.js';
import { attachments, records, sessions, users } from '../src/schema.js';
import { newToken, tokenHash } from '../src/auth.js';
import { uploadExamplePhoto } from './upload-photo.js';

test(
  'PostgreSQL: one owned avatar persists in profile, session and existing comments',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { db, pool } = database();
    await seed(db);
    const app = await buildApp();
    const ids = [randomUUID(), randomUUID()];
    const created: string[] = [];
    t.after(async () => {
      await app.close();
      if (created.length)
        await db.delete(records).where(inArray(records.id, created));
      await db.delete(attachments).where(inArray(attachments.ownerId, ids));
      await db.delete(users).where(inArray(users.id, ids));
      await pool.end();
    });
    const headers: { authorization: string }[] = [];
    for (const id of ids) {
      await db.insert(users).values({
        id,
        name: 'Pessoa da comunidade',
        email: id + '@test.invalid',
        role: 'citizen',
        municipalityId: '3304557',
        passwordHash: 'unused',
      });
      const token = newToken();
      await db.insert(sessions).values({
        userId: id,
        tokenHash: tokenHash(token),
        expiresAt: new Date(Date.now() + 120000),
      });
      headers.push({ authorization: 'Bearer ' + token });
    }
    const proposal = await app.inject({
      method: 'POST',
      url: '/api/civic-items',
      headers: headers[0],
      payload: {
        kind: 'proposal',
        title: 'Mais bancos junto à escola',
        summary: 'Assentos para quem aguarda',
        body: 'Instalar bancos próximos à entrada da escola.',
        neighborhood: 'Centro',
      },
    });
    assert.equal(proposal.statusCode, 200, proposal.body);
    const id = proposal.json().data.id;
    created.push(id);
    await app.inject({
      method: 'POST',
      url: '/api/civic-items/' + id + '/comments',
      headers: headers[0],
      payload: { text: 'Há espaço junto à entrada.' },
    });
    const avatar = await uploadExamplePhoto(app, headers[0]);
    assert.equal(
      (
        await app.inject({
          method: 'PUT',
          url: '/api/profile/avatar',
          payload: { avatar },
        })
      ).statusCode,
      401,
    );
    assert.equal(
      (
        await app.inject({
          method: 'PUT',
          url: '/api/profile/avatar',
          headers: headers[1],
          payload: { avatar },
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (
        await app.inject({
          method: 'PUT',
          url: '/api/profile/avatar',
          headers: headers[0],
          payload: { avatar: 'https://example.com/photo.jpg' },
        })
      ).statusCode,
      400,
    );
    const saved = await app.inject({
      method: 'PUT',
      url: '/api/profile/avatar',
      headers: headers[0],
      payload: { avatar },
    });
    assert.equal(saved.statusCode, 200, saved.body);
    assert.equal(saved.json().data.avatar, avatar);
    assert.equal(saved.json().data.id, ids[0]);
    const me = await app.inject({ url: '/api/auth/me', headers: headers[0] });
    assert.equal(me.json().data.avatar, avatar);
    const detail = await app.inject({
      url: '/api/civic-items/' + id,
      headers: headers[1],
    });
    assert.equal(detail.json().data.comments[0].avatar, avatar);
    const commentId = detail.json().data.comments[0].id;
    const commentPath = '/api/civic-items/' + id + '/comments/' + commentId;
    for (const method of ['PATCH', 'DELETE'] as const) {
      const extra =
        method === 'PATCH'
          ? { payload: { text: 'Alteração de outra conta' } }
          : {};
      assert.equal(
        (
          await app.inject({
            method,
            url: commentPath,
            headers: headers[1],
            ...extra,
          })
        ).statusCode,
        403,
      );
    }
    assert.equal(
      (
        await app.inject({
          method: 'PATCH',
          url: commentPath,
          headers: headers[0],
          payload: { text: '  ' },
        })
      ).statusCode,
      400,
    );
    const edited = await app.inject({
      method: 'PATCH',
      url: commentPath,
      headers: headers[0],
      payload: { text: 'Espaço disponível ao lado do portão.' },
    });
    assert.equal(edited.statusCode, 200, edited.body);
    assert.equal(
      edited.json().data.comments[0].text,
      'Espaço disponível ao lado do portão.',
    );
    assert.ok(edited.json().data.comments[0].editedAt);
    assert.equal(edited.json().data.comments[0].avatar, avatar);
    assert.equal(
      (
        await app.inject({
          method: 'DELETE',
          url: commentPath,
          headers: headers[0],
        })
      ).statusCode,
      200,
    );
    const after = await app.inject({
      url: '/api/civic-items/' + id,
      headers: headers[0],
    });
    assert.equal(after.json().data.comments.length, 0);
    const [other] = await db.select().from(users).where(eq(users.id, ids[1]));
    assert.equal(other.avatar, null);
  },
);
