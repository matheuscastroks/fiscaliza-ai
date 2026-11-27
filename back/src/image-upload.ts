import type { FastifyRequest } from 'fastify';

/**
 * Lê a única imagem de um corpo multipart e confere a assinatura dos bytes
 * contra o tipo declarado (JPEG, PNG ou WebP). Quem chama decodifica com sharp.
 */
export async function readImageUpload(
  req: FastifyRequest,
  fail: (statusCode: number, message: string) => Error,
): Promise<Buffer> {
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
  return buffer;
}
