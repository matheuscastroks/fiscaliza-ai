import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildApp } from '../src/app.js';

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
