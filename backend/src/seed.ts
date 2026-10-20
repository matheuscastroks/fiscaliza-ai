import { database } from './db.js';
import { officialRio } from './municipality.js';
import { hashPassword } from './auth.js';
import { seedBase } from './seed-base.js';

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

  await seedBase(db, rio, passwordHash);

  console.log('Base municipality and accounts seeded.');
} finally {
  await pool.end();
}
