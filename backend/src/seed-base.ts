import type { Database } from './db.js';
import type { officialRio } from './municipality.js';
import { municipalities, users } from './schema.js';

/** Installation defaults only: existing accounts and municipal data are authoritative. */
export async function seedBase(
  db: Pick<Database, 'transaction'>,
  municipality: Awaited<ReturnType<typeof officialRio>>,
  passwordHash: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(municipalities).values(municipality).onConflictDoNothing();
    await tx
      .insert(users)
      .values(
        [
          {
            id: 'citizen-ana',
            name: 'Beatriz Arantes',
            avatar: '/api/demo-media/avatar-ana.jpg',
            email: 'beatrizarante@gmail.com',
            role: 'citizen' as const,
          },
          {
            id: 'staff-gestao',
            name: 'Equipe de Gestão',
            avatar: '/api/demo-media/avatar-gestao.jpg',
            email: 'gestao@vilaesperanca.exemplo',
            role: 'staff' as const,
          },
          {
            id: 'admin-local',
            name: 'Administração',
            avatar: '/api/demo-media/avatar-admin.jpg',
            email: 'admin@vilaesperanca.exemplo',
            role: 'admin' as const,
          },
        ].map((account) => ({
          ...account,
          passwordHash,
          municipalityId: municipality.id,
        })),
      )
      .onConflictDoNothing();
  });
}
