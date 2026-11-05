import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { database } from '../src/db.js';

test('account migration preserves users, retires privileged sessions and rejects future privileged roles', { skip: !process.env.DATABASE_URL }, async () => {
  const { pool } = database();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Temp tables isolate the actual migration SQL from application data.
    await client.query("CREATE TEMP TABLE users(id text PRIMARY KEY, role text CHECK(role IN ('citizen','staff','admin')), sector text, name text) ON COMMIT DROP");
    await client.query('CREATE TEMP TABLE sessions(token_hash text, user_id text) ON COMMIT DROP');
    await client.query("INSERT INTO users VALUES ('one','citizen',NULL,'Pessoa'),('two','admin','Gestão','Outra pessoa'),('three','staff','Obras','Terceira pessoa')");
    await client.query("INSERT INTO sessions VALUES ('a','one'),('b','two'),('c','three')");
    await client.query(await readFile('migrations/0013_citizen_accounts_only.sql', 'utf8'));
    const rows = (await client.query('SELECT id,role,sector,name FROM users ORDER BY id')).rows;
    assert.equal(rows.length, 3);
    assert.ok(rows.every(row => row.role === 'citizen' && row.sector === null));
    assert.equal(rows.find(row => row.id === 'two')?.name, 'Outra pessoa');
    assert.deepEqual((await client.query('SELECT user_id FROM sessions')).rows, [{ user_id: 'one' }]);
    await assert.rejects(client.query("INSERT INTO users(id,role) VALUES ('four','admin')"), /check constraint/);
  } finally {
    await client.query('ROLLBACK');
    client.release();
    await pool.end();
  }
});
