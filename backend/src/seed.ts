import { sql } from 'drizzle-orm';
import { database } from './db.js';
import { officialRio } from './municipality.js';
import { hashPassword } from './auth.js';
import { users, municipalities } from './schema.js';

const { db, pool } = database();
try {
  const rio = await officialRio();
  const password =
    process.env.DEMO_PASSWORD ||
    (process.env.NODE_ENV === 'production' ? null : 'Fiscaliza123!');
  if (!password) {
    throw new Error('DEMO_PASSWORD must be explicitly set in production.');
  }
  const passwordHash = await hashPassword(password);

  await db.transaction(async (tx) => {
    await tx.insert(municipalities).values(rio).onConflictDoNothing();
    for (const u of [
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
    ]) {
      await tx
        .insert(users)
        .values({
          ...u,
          passwordHash,
          municipalityId: '3304557',
        })
        .onConflictDoNothing();
    }
    await tx.execute(
      sql`UPDATE users SET name='Beatriz Arantes', email='beatrizarante@gmail.com', municipality_id='3304557' WHERE id='citizen-ana'`,
    );
    await tx.execute(sql`DELETE FROM demo_engagement`);
    await tx.execute(sql`DELETE FROM records`);
  });

  console.log('Base accounts seeded and fake records cleared.');
} finally {
  await pool.end();
}
