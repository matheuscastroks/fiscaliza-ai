import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import type { Database } from '../src/db.js';
import { users } from '../src/schema.js';

// Cria uma conta de cidadão e a deixa com município definido (como depois do CEP).
export async function createCitizen(
  app: FastifyInstance,
  db: Database,
  municipalityId: string | null = '3304557',
) {
  const email = `teste-${randomUUID()}@example.test`;
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    remoteAddress: `203.0.113.${Math.floor(Math.random() * 250) + 1}`,
    payload: { name: 'Pessoa de teste', email, password: 'Senha-de-teste-123' },
  });
  assert.equal(response.statusCode, 201, response.body);
  const { user, token } = response.json().data as {
    user: { id: string };
    token: string;
  };
  if (municipalityId)
    await db.update(users).set({ municipalityId }).where(eq(users.id, user.id));
  return {
    id: user.id,
    email,
    headers: { authorization: `Bearer ${token}` } as Record<string, string>,
  };
}

// Envia uma foto gerada na hora (JPEG sólido) e devolve a URL do anexo.
export async function uploadPhoto(
  app: FastifyInstance,
  headers: Record<string, string>,
) {
  const bytes = await sharp({
    create: { width: 32, height: 32, channels: 3, background: '#336699' },
  })
    .jpeg()
    .toBuffer();
  const response = await app.inject({
    method: 'POST',
    url: '/api/attachments',
    headers: {
      ...headers,
      'content-type': 'multipart/form-data; boundary=required-photo',
    },
    payload: Buffer.concat([
      Buffer.from(
        '--required-photo\r\nContent-Disposition: form-data; name="file"; filename="foto.jpg"\r\nContent-Type: image/jpeg\r\n\r\n',
      ),
      bytes,
      Buffer.from('\r\n--required-photo--\r\n'),
    ]),
  });
  assert.equal(response.statusCode, 200, response.body);
  return response.json().data.url as string;
}
