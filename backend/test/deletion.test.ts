import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';
import { seed } from '../src/seed-data.js';
import { records, relations } from '../src/schema.js';
import type { Occurrence, Proposal } from '../../shared/contracts.js';

test(
  'PostgreSQL: author can delete only records without municipal intervention',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { db, pool } = database();
    await seed(db);
    const app = await buildApp();
    const created: string[] = [];
    t.after(async () => {
      await app.close();
      if (created.length)
        await db.delete(records).where(inArray(records.id, created));
      await pool.end();
    });
    async function login(email: string) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email,
          password: process.env.DEMO_PASSWORD || 'Fiscaliza123!',
        },
      });
      assert.equal(response.statusCode, 200, response.body);
      return { authorization: 'Bearer ' + response.json().data.token };
    }
    const owner = await login('beatrizarante@gmail.com');
    const staff = await login('gestao@vilaesperanca.exemplo');
    async function fixture(kind: 'occurrence' | 'proposal') {
      const id = randomUUID();
      const base = {
        id,
        municipalityId: '3304557',
        title: 'Registro para validar exclusão',
        comments: [],
      };
      const value: Occurrence | Proposal =
        kind === 'occurrence'
          ? {
              ...base,
              description: 'Relato do cidadão',
              category: 'road',
              status: 'pending',
              priority: 'low',
              location: {
                latitude: -22.9,
                longitude: -43.2,
                address: 'Centro',
              },
              images: ['/api/demo-media/lighting.jpg'],
              reportedBy: 'citizen-ana',
              reportedAt: new Date().toISOString(),
              votes: 0,
              statusHistory: [
                {
                  source: 'citizen',
                  status: 'pending',
                  at: new Date().toISOString(),
                  justification: 'Registro recebido',
                },
              ],
            }
          : {
              ...base,
              kind: 'proposal',
              status: 'submitted',
              summary: 'Resumo da proposta',
              body: 'Descrição da proposta',
              neighborhood: 'Centro',
              createdBy: 'citizen-ana',
              createdAt: new Date().toISOString(),
              responsible: 'Gestão municipal',
              supports: 0,
              linkedIds: [],
            };
      await db.insert(records).values({
        id,
        kind,
        municipalityId: '3304557',
        authorId: 'citizen-ana',
        data: value,
      });
      created.push(id);
      return {
        id,
        value,
        path:
          '/api/' +
          (kind === 'occurrence' ? 'occurrences' : 'civic-items') +
          '/' +
          id,
      };
    }
    for (const kind of ['occurrence', 'proposal'] as const) {
      const record = await fixture(kind);
      const comment = await app.inject({
        method: 'POST',
        url: record.path + '/comments',
        headers: owner,
        payload: { text: 'Complemento do autor' },
      });
      assert.equal(comment.statusCode, 200, comment.body);
      assert.equal(
        comment.json().data.comments[0].avatar,
        '/api/demo-media/avatar-ana.jpg',
      );
      assert.equal(comment.json().data.comments[0].userName, 'Beatriz Arantes');
      assert.equal(
        (await app.inject({ method: 'DELETE', url: record.path })).statusCode,
        401,
      );
      assert.equal(
        (
          await app.inject({
            method: 'DELETE',
            url: record.path,
            headers: staff,
          })
        ).statusCode,
        403,
      );
      await db.insert(relations).values({
        recordId: record.id,
        userId: 'citizen-ana',
        kind: 'support',
      });
      assert.equal(
        (
          await app.inject({
            method: 'DELETE',
            url: record.path,
            headers: owner,
          })
        ).statusCode,
        200,
      );
      assert.equal(
        (await app.inject({ url: record.path, headers: owner })).statusCode,
        404,
      );
      assert.equal(
        (
          await db
            .select()
            .from(relations)
            .where(eq(relations.recordId, record.id))
        ).length,
        0,
      );
      const attended = await fixture(kind);
      if ('kind' in attended.value)
        attended.value.history = [
          {
            at: new Date().toISOString(),
            actor: 'Gestão',
            from: 'submitted',
            to: 'submitted',
            text: 'Encaminhada para avaliação',
          },
        ];
      else
        attended.value.statusHistory.push({
          source: 'management',
          status: 'pending',
          at: new Date().toISOString(),
          justification: 'Triagem realizada',
        });
      await db
        .update(records)
        .set({ data: attended.value })
        .where(eq(records.id, attended.id));
      assert.equal(
        (
          await app.inject({
            method: 'DELETE',
            url: attended.path,
            headers: owner,
          })
        ).statusCode,
        409,
      );
      assert.equal(
        (await app.inject({ url: attended.path, headers: owner })).statusCode,
        200,
      );
    }
    const replied = await fixture('occurrence');
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: replied.path + '/comments',
          headers: staff,
          payload: { text: 'Equipe municipal verificando o local.' },
        })
      ).statusCode,
      200,
    );
    const withReply = await app.inject({ url: replied.path, headers: owner });
    assert.equal(withReply.json().data.canDelete, false);
    const replyId = withReply.json().data.comments[0].id;
    const removedReply = await app.inject({
      method: 'DELETE',
      url: replied.path + '/comments/' + replyId,
      headers: staff,
    });
    assert.equal(removedReply.statusCode, 200, removedReply.body);
    assert.equal(removedReply.json().data.canDelete, false);
    assert.equal(
      (
        await app.inject({
          method: 'DELETE',
          url: replied.path,
          headers: owner,
        })
      ).statusCode,
      409,
    );
  },
);
