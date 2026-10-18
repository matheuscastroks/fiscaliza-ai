import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type pg from 'pg';

export async function applyMigrations(
  pool: pg.Pool,
  directory = resolve('migrations'),
) {
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    await connection.query('SELECT pg_advisory_xact_lock(413720)');
    await connection.query(`CREATE TABLE IF NOT EXISTS migration_journal (
      name text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const files = (await readdir(directory))
      .filter((file) => file.endsWith('.sql'))
      .sort();
    for (const file of files) {
      const source = await readFile(resolve(directory, file), 'utf8');
      const checksum = createHash('sha256').update(source).digest('hex');
      const previous = await connection.query<{ checksum: string }>(
        'SELECT checksum FROM migration_journal WHERE name=$1',
        [file],
      );
      if (previous.rowCount) {
        if (previous.rows[0].checksum !== checksum)
          throw new Error(`Applied migration was modified: ${file}`);
        continue;
      }
      await connection.query(source);
      await connection.query(
        'INSERT INTO migration_journal(name,checksum) VALUES ($1,$2)',
        [file, checksum],
      );
    }
    await connection.query('COMMIT');
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
}
