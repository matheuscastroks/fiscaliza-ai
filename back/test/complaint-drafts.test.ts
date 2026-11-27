import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { createAnalysisQuota } from '../src/complaint-drafts-routes.js';
import { database } from '../src/db.js';
import {
  createGeminiAnalyzer,
  ImageAnalysisFailed,
  parseComplaintDraft,
  type ImageAnalyzer,
} from '../src/integrations/gemini.js';
import { applyMigrations } from '../src/migrations.js';
import { createCitizen } from './helpers.js';

const URL_PATH = '/api/v1/complaint-drafts/analyze';

const photo = (exif = false) => {
  const image = sharp({
    create: { width: 64, height: 48, channels: 3, background: '#555555' },
  });
  return (exif
    ? image.withExif({ IFD0: { Copyright: 'dado-pessoal', Artist: 'gps-fake' } })
    : image
  )
    .jpeg()
    .toBuffer();
};

const multipart = (bytes: Buffer, contentType = 'image/jpeg') =>
  Buffer.concat([
    Buffer.from(
      `--b\r\nContent-Disposition: form-data; name="file"; filename="foto.jpg"\r\nContent-Type: ${contentType}\r\n\r\n`,
    ),
    bytes,
    Buffer.from('\r\n--b--\r\n'),
  ]);

const analyze = (
  app: FastifyInstance,
  headers: Record<string, string>,
  bytes: Buffer,
  contentType?: string,
) =>
  app.inject({
    method: 'POST',
    url: URL_PATH,
    headers: { ...headers, 'content-type': 'multipart/form-data; boundary=b' },
    payload: multipart(bytes, contentType),
  });

test('parseComplaintDraft aceita só o contrato e limpa o texto', () => {
  assert.deepEqual(
    parseComplaintDraft(
      JSON.stringify({ isUrbanIssue: true, topicId: 'buraco', description: '  Buraco   grande\nna pista. ' }),
    ),
    { isUrbanIssue: true, topicId: 'buraco', description: 'Buraco grande na pista.' },
  );
  assert.deepEqual(
    parseComplaintDraft(
      JSON.stringify({ isUrbanIssue: false, topicId: 'lixo', description: 'Um gato no sofá.' }),
    ),
    { isUrbanIssue: false, topicId: 'outro', description: '' },
  );
  const long = parseComplaintDraft(
    JSON.stringify({ isUrbanIssue: true, topicId: 'lixo', description: 'a'.repeat(900) }),
  );
  assert.equal(long.description.length, 500);
  for (const bad of [
    'não é json',
    JSON.stringify({ isUrbanIssue: true, topicId: 'ponte', description: 'x' }),
    JSON.stringify({ isUrbanIssue: 'sim', topicId: 'lixo', description: 'x' }),
    JSON.stringify({ isUrbanIssue: true, topicId: 'lixo', description: '   ' }),
  ])
    assert.throws(() => parseComplaintDraft(bad), ImageAnalysisFailed);
});

test('createGeminiAnalyzer envia a foto com o pré-prompt e esquema, e trata falhas', async () => {
  let seen: { url: string; init: RequestInit } | null = null;
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  const ok = createGeminiAnalyzer({
    apiKey: 'chave-de-teste',
    model: 'gemini-3.1-flash-lite',
    fetch: (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return reply(200, {
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ isUrbanIssue: true, topicId: 'iluminacao', description: 'Poste apagado.' }) }],
            },
          },
        ],
      });
    }) as typeof fetch,
  });
  const image = await photo();
  assert.deepEqual(await ok(image), {
    isUrbanIssue: true,
    topicId: 'iluminacao',
    description: 'Poste apagado.',
  });
  const sent = seen as unknown as { url: string; init: RequestInit };
  assert.match(sent.url, /models\/gemini-3\.1-flash-lite:generateContent$/);
  assert.equal((sent.init.headers as Record<string, string>)['x-goog-api-key'], 'chave-de-teste');
  assert.doesNotMatch(sent.url, /chave-de-teste/);
  const body = JSON.parse(String(sent.init.body));
  assert.match(body.systemInstruction.parts[0].text, /Não invente endereço/);
  assert.equal(body.contents[0].parts[0].inlineData.data, image.toString('base64'));
  assert.equal(body.generationConfig.responseMimeType, 'application/json');
  assert.ok(body.generationConfig.responseSchema.properties.topicId.enum.includes('buraco'));

  const failing = (impl: () => Promise<Response>) =>
    createGeminiAnalyzer({ apiKey: 'k', fetch: impl as typeof fetch, timeoutMs: 20 });
  await assert.rejects(failing(async () => reply(500, {}))(image), ImageAnalysisFailed);
  await assert.rejects(failing(async () => reply(200, { candidates: [] }))(image), ImageAnalysisFailed);
  await assert.rejects(
    failing(async () => {
      throw new TypeError('fetch failed');
    })(image),
    ImageAnalysisFailed,
  );
  assert.throws(() => createGeminiAnalyzer({ apiKey: 'k', model: '../outro' }), /plain model id/);
});

test('cota diária limita por pessoa e no total, e renova no dia seguinte', () => {
  let now = new Date('2026-11-26T10:00:00Z');
  const quota = createAnalysisQuota({ perUserPerDay: 2, totalPerDay: 3 }, () => now);
  assert.equal(quota.take('a'), true);
  assert.equal(quota.take('a'), true);
  assert.equal(quota.take('a'), false);
  assert.equal(quota.take('b'), true);
  assert.equal(quota.take('c'), false);
  now = new Date('2026-11-27T00:00:01Z');
  assert.equal(quota.take('a'), true);
});

test(
  'PostgreSQL: análise por foto exige conta, descarta metadados e não expõe falhas do provedor',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const received: Buffer[] = [];
    let mode: 'ok' | 'fail' = 'ok';
    const analyzer: ImageAnalyzer = async (image) => {
      received.push(image);
      if (mode === 'fail') throw new ImageAnalysisFailed('HTTP 500');
      return { isUrbanIssue: true, topicId: 'buraco', description: 'Buraco na pista.' };
    };
    const app = await buildApp({ imageAnalyzer: analyzer });
    const disabled = await buildApp({ imageAnalyzer: null });
    const { db, pool } = database();
    t.after(async () => {
      await app.close();
      await disabled.close();
      await pool.end();
    });
    await applyMigrations(pool);
    const image = await photo(true);
    assert.ok((await sharp(image).metadata()).exif, 'a foto de teste precisa ter EXIF');

    const anonymous = await analyze(app, {}, image);
    assert.equal(anonymous.statusCode, 401);
    assert.equal(received.length, 0);

    const noMunicipality = await createCitizen(app, db, null);
    assert.equal((await analyze(app, noMunicipality.headers, image)).statusCode, 403);

    const citizen = await createCitizen(app, db);
    const response = await analyze(app, citizen.headers, image);
    assert.equal(response.statusCode, 200, response.body);
    assert.deepEqual(response.json().data, {
      isUrbanIssue: true,
      topicId: 'buraco',
      description: 'Buraco na pista.',
    });
    const meta = await sharp(received[0]).metadata();
    assert.equal(meta.format, 'jpeg');
    assert.equal(meta.exif, undefined);

    const fake = await analyze(app, citizen.headers, Buffer.from('não é imagem'));
    assert.equal(fake.statusCode, 400);
    const mismatch = await analyze(app, citizen.headers, image, 'image/png');
    assert.equal(mismatch.statusCode, 400);

    mode = 'fail';
    const failed = await analyze(app, citizen.headers, image);
    assert.equal(failed.statusCode, 502);
    assert.doesNotMatch(failed.body, /HTTP 500|Gemini/);

    const other = await createCitizen(disabled, db);
    assert.equal((await analyze(disabled, other.headers, image)).statusCode, 503);
  },
);
