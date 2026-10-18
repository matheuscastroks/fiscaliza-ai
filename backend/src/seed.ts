import { database } from './db.js';
import { seed } from './seed-data.js';
const { db, pool } = database();
try {
  await seed(db);
  console.log('Seed applied idempotently.');
} finally {
  await pool.end();
}
