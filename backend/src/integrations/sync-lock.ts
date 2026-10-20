import type pg from 'pg';

/** Dedicated session, shared by API and CLI, separate from citizen mutation locks. */
export async function withSourceLock<T>(
  pool: pg.Pool,
  sourceId: string,
  run: () => Promise<T>,
): Promise<T> {
  const connection = await pool.connect();
  let locked = false;
  try {
    const result = await connection.query<{ locked: boolean }>(
      'SELECT pg_try_advisory_lock(774146, hashtext($1)) AS locked',
      [sourceId],
    );
    locked = result.rows[0].locked;
    if (!locked)
      throw Object.assign(
        new Error('Já existe uma sincronização desta fonte em andamento.'),
        { statusCode: 409 },
      );
    return await run();
  } finally {
    let discard = false;
    try {
      if (locked)
        await connection.query(
          'SELECT pg_advisory_unlock(774146, hashtext($1))',
          [sourceId],
        );
    } catch {
      // An uncertain session must never return to the pool holding a lock.
      discard = true;
    }
    connection.release(discard);
  }
}
