import type { FastifyInstance, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { and, eq, inArray } from 'drizzle-orm';
import type { Database } from './db.js';
import { attachments } from './schema.js';
import { readImageUpload } from './image-upload.js';

export const attachmentId = (url: string | null | undefined) =>
  url?.match(/^\/api\/attachments\/([a-f0-9-]{36})$/)?.[1] ?? null;

// Apaga os arquivos (as linhas do banco já foram tratadas por quem chama).
export async function removeUploadFiles(uploadDir: string, ids: string[]) {
  await Promise.all(
    ids.map((id) => unlink(resolve(uploadDir, id)).catch(() => undefined)),
  );
}

export async function removeAttachments(
  db: Database,
  uploadDir: string,
  ownerId: string,
  ids: string[],
) {
  if (ids.length === 0) return;
  await db
    .delete(attachments)
    .where(
      and(inArray(attachments.id, ids), eq(attachments.ownerId, ownerId)),
    );
  await removeUploadFiles(uploadDir, ids);
}

export function registerAttachmentsRoutes(
  app: FastifyInstance,
  options: {
    db: Database;
    uploadDir: string;
    ok: (data: unknown) => unknown;
    fail: (statusCode: number, message: string) => Error;
    municipalityId: (req: FastifyRequest) => string;
  },
) {
  const { db, uploadDir, ok, fail, municipalityId } = options;

  app.post(
    '/api/attachments',
    {
      // Sem fila por usuário: o corpo multipart é lento e não deve segurar as
      // outras escritas da conta.
      config: { userLock: false, rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (req) => {
      const buffer = await readImageUpload(req, fail);
      let sanitized: Buffer;
      try {
        sanitized = await sharp(buffer, {
          limitInputPixels: 16000000,
          failOn: 'error',
        })
          .rotate()
          .resize({ width: 2048, withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
      } catch {
        throw fail(
          400,
          'A imagem está corrompida ou excede o tamanho permitido.',
        );
      }
      const id = randomUUID();
      await mkdir(uploadDir, { recursive: true });
      await writeFile(resolve(uploadDir, id), sanitized, { flag: 'wx' });
      try {
        await db.insert(attachments).values({
          id,
          municipalityId: municipalityId(req),
          mime: 'image/webp',
          ownerId: req.user!.id,
        });
      } catch (error) {
        await unlink(resolve(uploadDir, id));
        throw error;
      }
      return ok({ url: `/api/attachments/${id}` });
    },
  );

  app.get<{ Params: { id: string } }>(
    '/api/attachments/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          additionalProperties: false,
          properties: { id: { type: 'string', pattern: '^[a-f0-9-]{36}$' } },
        },
      },
    },
    async (req, reply) => {
      if (!/^[a-f0-9-]{36}$/.test(req.params.id))
        throw fail(404, 'Anexo não encontrado.');
      const [row] = await db
        .select()
        .from(attachments)
        .where(eq(attachments.id, req.params.id));
      if (!row) throw fail(404, 'Anexo não encontrado.');
      try {
        return reply
          .type(row.mime)
          .header('X-Content-Type-Options', 'nosniff')
          // Foto de perfil: o CDN não guarda cópia, para ela sumir junto com a
          // conta ou com a troca de avatar.
          .header('Cache-Control', 'private, no-store')
          .send(await readFile(resolve(uploadDir, row.id)));
      } catch {
        throw fail(404, 'Anexo não encontrado.');
      }
    },
  );
}
