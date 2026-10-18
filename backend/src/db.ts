import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
export function database(url = process.env.DATABASE_URL) {
  const pool = new pg.Pool({
    connectionString:
      url ?? 'postgres://fiscaliza:fiscaliza@localhost:5432/fiscaliza',
    connectionTimeoutMillis: 5000,
    max: 10,
  });
  return { pool, db: drizzle(pool, { schema }) };
}
export type Database = ReturnType<typeof database>['db'];
