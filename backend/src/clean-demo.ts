import { sql } from 'drizzle-orm';
import { database } from './db.js';

if (
  process.env.NODE_ENV === 'production' &&
  process.env.ALLOW_DEMO_CLEANUP !== 'true'
) {
  throw new Error(
    'Refusing to run demo cleanup in production without ALLOW_DEMO_CLEANUP=true.',
  );
}

const { db, pool } = database();
try {
  await db.transaction(async (tx) => {
    await tx.execute(sql`DELETE FROM demo_engagement`);
    await tx.execute(sql`DELETE FROM records`);
  });
  console.log('Demo records and engagement cleared explicitly.');
} finally {
  await pool.end();
}
