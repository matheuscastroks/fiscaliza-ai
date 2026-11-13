import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DEV_DATABASE_URL } from './config.js';
import * as schema from './schema.js';

export type DatabaseOptions = {
  max?: number;
  // Tempos em ms. Sem valor, o Postgres não impõe limite (usado pelos CLIs de
  // sincronização, que fazem trabalhos longos). A API define todos.
  statementTimeoutMs?: number;
  lockTimeoutMs?: number;
  idleInTransactionTimeoutMs?: number;
};

export function database(
  url: string | undefined = process.env.DATABASE_URL,
  options: DatabaseOptions = {},
) {
  const pool = new pg.Pool({
    connectionString: url ?? DEV_DATABASE_URL,
    connectionTimeoutMillis: 5000,
    max: options.max ?? 10,
    ...(options.statementTimeoutMs
      ? { statement_timeout: options.statementTimeoutMs }
      : {}),
    ...(options.lockTimeoutMs ? { lock_timeout: options.lockTimeoutMs } : {}),
    ...(options.idleInTransactionTimeoutMs
      ? {
          idle_in_transaction_session_timeout:
            options.idleInTransactionTimeoutMs,
        }
      : {}),
  });
  // Erro em conexão ociosa não pode derrubar o processo, mas precisa aparecer.
  pool.on('error', (error) => {
    console.error('[db] erro em conexão ociosa do pool:', error.message);
  });
  return { pool, db: drizzle(pool, { schema }) };
}
export type Database = ReturnType<typeof database>['db'];
export type ReadDatabase = Pick<Database, 'select' | 'selectDistinct'>;
