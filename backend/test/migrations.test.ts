import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { database } from '../src/db.js';
import { applyMigrations } from '../src/migrations.js';
import { seed } from '../src/seed-data.js';

test(
  'PostgreSQL: migration journal and seed preserve later unassigned staff and changed residence',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { db, pool } = database();
    t.after(() => pool.end());
    await applyMigrations(pool);
    const suffix = randomUUID();
    const staff = `unassigned-${suffix}`;
    const citizen = `moved-${suffix}`;
    const otherCity = '9999998'; // Synthetic test-only territory, removed below.
    await pool.query(
      `INSERT INTO municipalities(id,data,geometry)
    SELECT $1,jsonb_set(data,'{id}',to_jsonb($1::text)),geometry FROM municipalities WHERE id='3304557'
    ON CONFLICT DO NOTHING`,
      [otherCity],
    );
    await pool.query(
      `INSERT INTO users(id,name,email,role,password_hash,municipality_id) VALUES
    ($1,'Unassigned staff',$1 || '@test.invalid','staff','unused',NULL),
    ($2,'Moved citizen',$2 || '@test.invalid','citizen','unused',$3)`,
      [staff, citizen, otherCity],
    );
    try {
      await applyMigrations(pool);
      await seed(db);
      const result = await pool.query<{
        id: string;
        municipality_id: string | null;
      }>('SELECT id,municipality_id FROM users WHERE id=ANY($1::text[])', [
        [staff, citizen],
      ]);
      assert.equal(
        result.rows.find((row) => row.id === staff)?.municipality_id,
        null,
      );
      assert.equal(
        result.rows.find((row) => row.id === citizen)?.municipality_id,
        otherCity,
      );
      const journal = await pool.query(
        'SELECT name,checksum FROM migration_journal ORDER BY name',
      );
      assert.ok(
        journal.rows.some((row) => row.name === '0002_municipalities.sql'),
      );
      assert.ok(
        journal.rows.every((row) => /^[a-f0-9]{64}$/.test(row.checksum)),
      );
    } finally {
      await pool.query('DELETE FROM users WHERE id=ANY($1::text[])', [
        [staff, citizen],
      ]);
      await pool.query('DELETE FROM municipalities WHERE id=$1', [otherCity]);
    }
  },
);
