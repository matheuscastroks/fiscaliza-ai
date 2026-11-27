import type { FastifyInstance } from 'fastify';
import sharp from 'sharp';
import { readImageUpload } from './image-upload.js';
import { ImageAnalysisFailed, type ImageAnalyzer } from './integrations/gemini.js';

export interface AnalysisQuota {
  perUserPerDay: number;
  totalPerDay: number;
}

/**
 * Teto diário de análises (custo do Gemini). Fica na memória do processo:
 * reinício zera a contagem, e várias réplicas teriam tetos separados.
 */
export function createAnalysisQuota(
  limits: AnalysisQuota,
  now: () => Date = () => new Date(),
) {
  let day = '';
  let total = 0;
  const perUser = new Map<string, number>();
  const today = () => now().toISOString().slice(0, 10);
  return {
    /** Reserva uma análise; devolve false quando o teto já foi atingido. */
    take(userId: string) {
      if (today() !== day) {
        day = today();
        total = 0;
        perUser.clear();
      }
      const used = perUser.get(userId) ?? 0;
      if (used >= limits.perUserPerDay || total >= limits.totalPerDay) return false;
      perUser.set(userId, used + 1);
      total += 1;
      return true;
    },
  };
}

export function registerComplaintDraftRoutes(
  app: FastifyInstance,
  options: {
    analyzer: ImageAnalyzer | null;
    quota: ReturnType<typeof createAnalysisQuota>;
    ok: (data: unknown) => unknown;
    fail: (statusCode: number, message: string) => Error;
  },
) {
  const { analyzer, quota, ok, fail } = options;

  // Conta obrigatória: o hook global exige sessão e município em toda escrita.
  // A foto é analisada em memória e descartada; nada é gravado.
  app.post(
    '/api/v1/complaint-drafts/analyze',
    { config: { userLock: false, rateLimit: { max: 6, timeWindow: '1 minute' } } },
    async (req) => {
      if (!analyzer)
        throw fail(503, 'A análise por foto não está disponível agora.');
      const buffer = await readImageUpload(req, fail);
      let image: Buffer;
      try {
        // Sem metadados (sharp descarta EXIF, incluindo o GPS do aparelho).
        image = await sharp(buffer, { limitInputPixels: 16000000, failOn: 'error' })
          .rotate()
          .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
      } catch {
        throw fail(400, 'A imagem está corrompida ou excede o tamanho permitido.');
      }
      if (!quota.take(req.user!.id))
        throw fail(429, 'Você atingiu o limite de análises por hoje. Descreva o problema no texto.');
      try {
        return ok(await analyzer(image));
      } catch (error) {
        if (error instanceof ImageAnalysisFailed) {
          // O 502 também vai para o Sentry pelo tratador de erros; o motivo fica no log.
          req.log.warn({ reason: error.message }, 'Análise de foto indisponível.');
          throw fail(502, 'Não foi possível analisar a foto agora.');
        }
        throw error;
      }
    },
  );
}
