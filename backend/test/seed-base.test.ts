import test from 'node:test';
import assert from 'node:assert/strict';
import type pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { database, type Database } from '../src/db.js';
import { officialRio } from '../src/municipality.js';
import { seedBase } from '../src/seed-base.js';
import * as schema from '../src/schema.js';

// A savepoint inside this transaction exercises the production seed without
// changing shared test accounts or depending on a particular test-file order.
async function withRollback(
  run: (
    db: Pick<Database, 'transaction'>,
    client: pg.PoolClient,
  ) => Promise<void>,
) {
  const { pool } = database();
  const connection = await pool.connect();
  const rollback = new Error('rollback seed fixture');
  try {
    await assert.rejects(
      drizzle(connection, { schema }).transaction(async (tx) => {
        await run(tx, connection);
        throw rollback;
      }),
      (error) => error === rollback,
    );
  } finally {
    connection.release();
    await pool.end();
  }
}

// An unconditional UPDATE/DELETE in seedBase must break this test.
test(
  'base seed preserves edited accounts, passwords and civic records on repeated runs',
  {
    skip: !process.env.DATABASE_URL,
  },
  async () =>
    withRollback(async (tx, client) => {
      const rio = await officialRio();
      await seedBase(tx, rio, 'original-hash');
      await client.query(
        "INSERT INTO municipalities(id,data,geometry) SELECT '9999997',jsonb_set(data,'{id}','\"9999997\"'),geometry FROM municipalities WHERE id='3304557' ON CONFLICT DO NOTHING",
      );
      await client.query(
        "UPDATE users SET name='Nome escolhido',email='changed@test.invalid',password_hash='changed-hash',municipality_id='9999997' WHERE id='citizen-ana'",
      );
      await client.query(
        "INSERT INTO records(id,kind,municipality_id,author_id,data) VALUES ('seed-preserved','occurrence','3304557','citizen-ana','{}')",
      );
      await client.query(
        "INSERT INTO official_calls(id,external_id,service_type,service_subtype,opened_at) VALUES ('seed-official','seed-official','Lighting','Repair',now())",
      );
      const read = async () => ({
        user: (await client.query("SELECT * FROM users WHERE id='citizen-ana'"))
          .rows,
        record: (
          await client.query("SELECT * FROM records WHERE id='seed-preserved'")
        ).rows,
        call: (
          await client.query(
            "SELECT * FROM official_calls WHERE id='seed-official'",
          )
        ).rows,
        municipality: (
          await client.query("SELECT * FROM municipalities WHERE id='3304557'")
        ).rows,
      });
      const before = await read();
      await seedBase(tx, rio, 'replacement-hash');
      await seedBase(tx, rio, 'replacement-hash');
      assert.deepEqual(await read(), before);
      assert.equal(
        (
          await client.query(
            "SELECT id FROM users WHERE id IN ('citizen-ana','staff-gestao','admin-local')",
          )
        ).rowCount,
        3,
      );
    }),
);

// ON CONFLICT UPDATE would seize an email that belongs to someone else.
test(
  'base seed leaves an email owned by another account untouched',
  {
    skip: !process.env.DATABASE_URL,
  },
  async () =>
    withRollback(async (tx, client) => {
      // Use a savepoint so existing admin relations never need deletion.
      await tx.transaction(async (nested) => {
        await nested.execute(
          sql`UPDATE users SET email='old-admin@test.invalid' WHERE id='admin-local'`,
        );
        await nested.execute(
          sql`INSERT INTO users(id,name,email,role,password_hash) VALUES ('email-owner','Outra pessoa','admin@vilaesperanca.exemplo','citizen','private-hash')`,
        );
        const before = (
          await client.query("SELECT * FROM users WHERE id='email-owner'")
        ).rows;
        await seedBase(nested, await officialRio(), 'new-hash');
        assert.deepEqual(
          (await client.query("SELECT * FROM users WHERE id='email-owner'"))
            .rows,
          before,
        );
      });
    }),
);
