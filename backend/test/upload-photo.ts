import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import type { FastifyInstance } from 'fastify';

export async function uploadExamplePhoto(
  app: FastifyInstance,
  headers: Record<string, string>,
) {
  const bytes = await readFile('data/demo-media/lighting.jpg');
  const response = await app.inject({
    method: 'POST',
    url: '/api/attachments',
    headers: {
      ...headers,
      'content-type': 'multipart/form-data; boundary=required-photo',
    },
    payload: Buffer.concat([
      Buffer.from(
        '--required-photo\r\nContent-Disposition: form-data; name="file"; filename="street.jpg"\r\nContent-Type: image/jpeg\r\n\r\n',
      ),
      bytes,
      Buffer.from('\r\n--required-photo--\r\n'),
    ]),
  });
  assert.equal(response.statusCode, 200, response.body);
  return response.json().data.url as string;
}
