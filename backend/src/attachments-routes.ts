import type { FastifyInstance, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { eq } from 'drizzle-orm';
import type { Database } from './db.js';
import { attachments } from './schema.js';

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
    { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req) => {
      // Multipart is consumed inside the handler, unlike JSON bodies. Aborting
      // its stream must reject the read so the handler's lock finally can run.
      let part: Awaited<ReturnType<typeof req.file>>;
      let abortRead: () => void = () => {};
      const aborted = new Promise<never>((_resolve, reject) => {
        abortRead = () => {
          part?.file.destroy();
          reject(fail(499, 'Upload aborted.'));
        };
        req.raw.once('aborted', abortRead);
      });
      let buffer: Buffer;
      try {
        buffer = await Promise.race([
          (async () => {
            part = await req.file();
            if (!part) throw fail(400, 'Selecione uma imagem.');
            return part.toBuffer();
          })(),
          aborted,
        ]);
        if (req.raw.aborted || req.raw.socket.destroyed)
          throw fail(499, 'Upload aborted.');
      } finally {
        req.raw.off('aborted', abortRead);
      }
      if (!part) throw fail(400, 'Selecione uma imagem.');
      const mime = buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
        ? 'image/jpeg'
        : buffer
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          ? 'image/png'
          : buffer.subarray(0, 4).toString() === 'RIFF' &&
              buffer.subarray(8, 12).toString() === 'WEBP'
            ? 'image/webp'
            : null;
      if (!mime || part.mimetype !== mime)
        throw fail(400, 'Use uma imagem JPEG, PNG ou WebP válida.');
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

  app.get<{ Params: { name: string } }>(
    '/api/demo-media/:name',
    async (req, reply) => {
      if (
        ![
          'lighting.jpg',
          'benches.jpg',
          'sidewalk.jpg',
          'avatar-ana.jpg',
          'avatar-gestao.jpg',
          'avatar-admin.jpg',
          'road.jpg',
          'waste.jpg',
          'crossing.jpg',
          'gloria-dark.jpg',
          'legacy-light-1.jpg',
          'legacy-light-2.jpg',
          'legacy-light-3.jpg',
          'legacy-light-4.jpg',
          'gloria-light.jpg',
          'recycling.jpg',
          'park-path.jpg',
          'park-shade.jpg',
          'crossing-day.jpg',
          'accessible-path.jpg',
        ].includes(req.params.name)
      )
        throw fail(404, 'Imagem de exemplo não encontrada.');
      try {
        return reply
          .type('image/jpeg')
          .header('X-Content-Type-Options', 'nosniff')
          .header('Cache-Control', 'public, max-age=86400')
          .send(await readFile(resolve('data/demo-media', req.params.name)));
      } catch {
        throw fail(404, 'Imagem de exemplo não encontrada.');
      }
    },
  );

  app.get<{ Params: { id: string } }>(
    '/api/attachments/:id',
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
          .header('Cache-Control', 'public, max-age=86400')
          .send(await readFile(resolve(uploadDir, row.id)));
      } catch {
        throw fail(404, 'Anexo não encontrado.');
      }
    },
  );
}
