import { database } from './db.js';
import { applyMigrations } from './migrations.js';
const { pool } = database();
try {
  await applyMigrations(pool);
  console.log('Migration applied.');
} finally {
  await pool.end();
}
