import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';
import { seed } from '../src/seed-data.js';
import sharp from 'sharp';

test(
  'PostgreSQL: shared lifecycle, permissions and unique participation',
  {
    skip: !process.env.DATABASE_URL
      ? 'DATABASE_URL absent; real PostgreSQL integration not run'
      : false,
  },
  async (t) => {
    const { db, pool } = database();
    t.after(() => pool.end());
    await seed(db);
    const app = await buildApp({
      fetch: async () =>
        Response.json({
          cep: '20010-000',
          ibge: '3304557',
          localidade: 'Rio de Janeiro',
          uf: 'RJ',
          bairro: 'Centro',
          logradouro: 'Rua de teste',
        }),
    });
    t.after(() => app.close());
    async function login(email: string) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email,
          password: process.env.DEMO_PASSWORD || 'Fiscaliza123!',
        },
      });
      assert.equal(response.statusCode, 200);
      return { authorization: `Bearer ${response.json().data.token}` };
    }
    const citizen = await login('ana@vilaesperanca.exemplo');
    const confirm = await app.inject({
      method: 'PUT',
      url: '/api/profile/municipality',
      headers: citizen,
      payload: { postalCode: '20010000', municipalityId: '3304557' },
    });
    assert.equal(confirm.statusCode, 200, confirm.body);
    const staff = await login('gestao@vilaesperanca.exemplo');
    const browserLogin = async (email: string, client?: string) =>
      app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: client ? { 'x-fiscaliza-client': client } : {},
        payload: {
          email,
          password: process.env.DEMO_PASSWORD || 'Fiscaliza123!',
        },
      });
    const citizenLogin = await browserLogin(
      'ana@vilaesperanca.exemplo',
      'citizen',
    );
    const managementLogin = await browserLogin('gestao@vilaesperanca.exemplo');
    const citizenCookie =
      citizenLogin.headers['set-cookie']!.toString().split(';')[0];
    const managementCookie =
      managementLogin.headers['set-cookie']!.toString().split(';')[0];
    assert.ok(citizenCookie.startsWith('citizen_session='));
    assert.ok(managementCookie.startsWith('session='));
    const browserCookies = `${citizenCookie}; ${managementCookie}`;
    assert.equal(
      (
        await app.inject({
          url: '/api/auth/me',
          headers: { cookie: browserCookies, 'x-fiscaliza-client': 'citizen' },
        })
      ).json().data.role,
      'citizen',
    );
    assert.equal(
      (
        await app.inject({
          url: '/api/auth/me',
          headers: { cookie: browserCookies },
        })
      ).json().data.role,
      'staff',
    );
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/api/auth/logout',
          headers: {
            cookie: browserCookies,
            'x-fiscaliza-client': 'citizen',
            origin: 'http://localhost:5173',
          },
        })
      ).statusCode,
      200,
    );
    assert.equal(
      (
        await app.inject({
          url: '/api/auth/me',
          headers: { cookie: browserCookies },
        })
      ).statusCode,
      200,
    );
    const create = await app.inject({
      method: 'POST',
      url: '/api/occurrences',
      headers: citizen,
      payload: {
        title: 'Buraco na Rua do teste',
        description: 'Buraco prejudica passagem de pedestres.',
        category: 'road',
        location: {
          latitude: -22.904,
          longitude: -43.186,
          address: 'Rua do teste',
          neighborhood: 'Centro',
        },
      },
    });
    assert.equal(create.statusCode, 200);
    const id = create.json().data.id;
    for (let i = 0; i < 2; i++)
      assert.equal(
        (
          await app.inject({
            method: 'PUT',
            url: `/api/occurrences/${id}/support`,
            headers: citizen,
          })
        ).statusCode,
        200,
      );
    const get = await app.inject({
      url: `/api/occurrences/${id}`,
      headers: citizen,
    });
    assert.equal(get.json().data.votes, 1);
    assert.equal(get.json().data.supportedByMe, true);
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: `/api/occurrences/${id}/transitions`,
          headers: citizen,
          payload: {
            status: 'in_progress',
            justification: 'Tentativa indevida',
          },
        })
      ).statusCode,
      403,
    );
    for (const status of ['in_progress', 'resolved'])
      assert.equal(
        (
          await app.inject({
            method: 'POST',
            url: `/api/occurrences/${id}/transitions`,
            headers: staff,
            payload: { status, justification: 'Equipe verificou o local.' },
          })
        ).statusCode,
        200,
      );
    const evaluation = await app.inject({
      method: 'POST',
      url: `/api/occurrences/${id}/evaluation`,
      headers: citizen,
      payload: { satisfied: false, reason: 'Ainda há buraco.' },
    });
    assert.equal(evaluation.statusCode, 200);
    assert.equal(evaluation.json().data.status, 'resolved');
    assert.deepEqual(evaluation.json().data.statusHistory.map((event: { source?: string }) => event.source),
      ['citizen', 'management', 'management', 'citizen']);
    assert.match(
      evaluation.json().data.statusHistory.at(-1).justification,
      /Revisão/,
    );
    const civic = await app.inject({
      method: 'POST',
      url: '/api/civic-items',
      headers: staff,
      payload: {
        kind: 'consultation',
        title: 'Consulta de teste',
        summary: 'Prioridade local',
        body: 'Escolha uma opção.',
        neighborhood: 'Centro',
        closesAt: new Date(Date.now() + 86400000).toISOString(),
        options: ['Uma', 'Outra'],
      },
    });
    assert.equal(civic.statusCode, 200);
    const cid = civic.json().data.id;
    for (let i = 0; i < 2; i++)
      assert.equal(
        (
          await app.inject({
            method: 'PUT',
            url: `/api/civic-items/${cid}/answer`,
            headers: citizen,
            payload: { option: 0 },
          })
        ).statusCode,
        200,
      );
    const result = await app.inject({
      url: `/api/civic-items/${cid}`,
      headers: citizen,
    });
    assert.deepEqual(result.json().data.answerCounts, [1, 0]);
    assert.equal(
      (
        await app.inject({
          method: 'PATCH',
          url: `/api/civic-items/${cid}`,
          headers: staff,
          payload: { status: 'closed' },
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (
        await app.inject({
          method: 'PATCH',
          url: `/api/civic-items/${cid}`,
          headers: staff,
          payload: {
            status: 'closed',
            result: 'Primeira opção foi escolhida.',
          },
        })
      ).statusCode,
      200,
    );
    assert.equal(
      (
        await app.inject({
          method: 'PUT',
          url: `/api/civic-items/${cid}/answer`,
          headers: citizen,
          payload: { option: 1 },
        })
      ).statusCode,
      409,
    );
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/api/presentation/reset',
          headers: citizen,
          payload: { scenario: 'registered' },
        })
      ).statusCode,
      403,
    );
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/api/occurrences',
          headers: citizen,
          payload: { userId: 'someone' },
        })
      ).statusCode,
      400,
    );
    await Promise.all(
      Array.from({ length: 12 }, () =>
        app.inject({
          method: 'PUT',
          url: `/api/occurrences/${id}/support`,
          headers: citizen,
        }),
      ),
    );
    assert.equal(
      (
        await app.inject({ url: `/api/occurrences/${id}`, headers: citizen })
      ).json().data.votes,
      1,
    );
    await Promise.all(
      Array.from({ length: 4 }, (_, i) =>
        app.inject({
          method: 'POST',
          url: `/api/occurrences/${id}/comments`,
          headers: citizen,
          payload: { text: `Complemento ${i}` },
        }),
      ),
    );
    assert.equal(
      (
        await app.inject({ url: `/api/occurrences/${id}`, headers: citizen })
      ).json().data.comments.length,
      4,
    );
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: `/api/occurrences/${id}/evaluation`,
          headers: staff,
          payload: { satisfied: true, reason: 'Outro usuário' },
        })
      ).statusCode,
      403,
    );
    const cookieLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'ana@vilaesperanca.exemplo',
        password: process.env.DEMO_PASSWORD || 'Fiscaliza123!',
      },
    });
    const cookie = cookieLogin.headers['set-cookie']!.toString().split(';')[0];
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/api/auth/logout',
          headers: { cookie },
        })
      ).statusCode,
      403,
    );
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/api/auth/logout',
          headers: { cookie, origin: 'http://localhost:5173' },
        })
      ).statusCode,
      200,
    );
    assert.equal(
      (await app.inject({ url: '/api/auth/me', headers: { cookie } }))
        .statusCode,
      401,
    );
    const upload = async (bytes: Buffer) =>
      app.inject({
        method: 'POST',
        url: '/api/attachments',
        headers: {
          ...citizen,
          'content-type': 'multipart/form-data; boundary=fiscaliza-test',
        },
        payload: Buffer.concat([
          Buffer.from(
            '--fiscaliza-test\r\nContent-Disposition: form-data; name="file"; filename="evidencia.png"\r\nContent-Type: image/png\r\n\r\n',
          ),
          bytes,
          Buffer.from('\r\n--fiscaliza-test--\r\n'),
        ]),
      });
    assert.equal(
      (await upload(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).statusCode,
      400,
    );
    const image = await sharp({
      create: { width: 2, height: 2, channels: 3, background: '#176287' },
    })
      .png()
      .toBuffer();
    const attachment = await upload(image);
    assert.equal(attachment.statusCode, 200);
    const served = await app.inject(attachment.json().data.url);
    assert.equal(served.statusCode, 200);
    assert.equal(served.headers['content-type'], 'image/webp');
    const restarted = await buildApp();
    t.after(() => restarted.close());
    assert.equal(
      (await restarted.inject(attachment.json().data.url)).statusCode,
      200,
    );
    assert.equal(
      (
        await restarted.inject({
          url: `/api/occurrences/${id}`,
          headers: citizen,
        })
      ).json().data.votes,
      1,
    );
    const admin = await login('admin@vilaesperanca.exemplo');
    for (const [scenario, status] of [
      ['registered', 'pending'],
      ['in_progress', 'in_progress'],
      ['resolved', 'resolved'],
    ]) {
      assert.equal(
        (
          await app.inject({
            method: 'POST',
            url: '/api/presentation/reset',
            headers: admin,
            payload: { scenario },
          })
        ).statusCode,
        200,
      );
      assert.equal(
        (
          await app.inject({
            url: '/api/occurrences/occ-iluminacao-centro',
            headers: citizen,
          })
        ).json().data.status,
        status,
      );
    }
  },
);
