import { sql } from 'drizzle-orm';
import type { Database } from './db.js';
import { removeUploadFiles } from './attachments-routes.js';

// Fotos enviadas e nunca usadas (a pessoa desistiu antes de salvar o avatar) ou
// que perderam o vínculo. Só apaga com mais de um dia, para não pegar um envio
// que ainda está em andamento.
export async function removeOrphanAttachments(
  db: Database,
  uploadDir: string,
  olderThanMs = 24 * 60 * 60 * 1000,
): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMs);
  const result = await db.execute<{ id: string }>(sql`
    DELETE FROM attachments a
    WHERE a.created_at < ${cutoff}
      AND NOT EXISTS (
        SELECT 1 FROM users u WHERE u.avatar = '/api/attachments/' || a.id
      )
    RETURNING a.id
  `);
  const ids = result.rows.map((row) => row.id);
  await removeUploadFiles(uploadDir, ids);
  return ids.length;
}
