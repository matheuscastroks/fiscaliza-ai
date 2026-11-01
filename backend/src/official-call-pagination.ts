import { createHash } from 'node:crypto';

export function callCursorScope(query: Record<string, string | undefined>) {
  const filters = Object.entries(query)
    .filter(
      ([key, value]) =>
        !['cursor', 'page', 'includeTotal'].includes(key) &&
        value !== undefined,
    )
    .sort(([a], [b]) => a.localeCompare(b));
  return createHash('sha256').update(JSON.stringify(filters)).digest('hex');
}

export function encodeCallCursor(
  openedAt: Date | string,
  externalId: string,
  scope: string,
) {
  return Buffer.from(
    JSON.stringify({
      date: typeof openedAt === 'string' ? openedAt : openedAt.toISOString(),
      id: externalId,
      scope,
    }),
  ).toString('base64url');
}

export function decodeCallCursor(
  cursor: string,
  scope: string,
): { date: string; id: string } {
  if (cursor.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(cursor))
    throw new Error('Cursor inválido.');
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (
      value.scope !== scope ||
      typeof value.id !== 'string' ||
      !value.id ||
      value.id.length > 256 ||
      typeof value.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3,6}Z$/.test(value.date) ||
      !Number.isFinite(Date.parse(value.date)) ||
      new Date(value.date).toISOString() !== value.date.slice(0, 23) + 'Z'
    )
      throw new Error();
    return { date: value.date, id: value.id };
  } catch {
    throw new Error('Cursor inválido ou incompatível com os filtros.');
  }
}
