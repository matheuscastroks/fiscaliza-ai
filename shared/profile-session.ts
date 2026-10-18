interface SessionContext {
  userId?: string;
  version: number;
  authenticated: boolean;
}
/** A late profile response must never restore a logged-out or replaced session. */
export async function applyCurrentProfile(
  expected: { userId: string; version: number },
  read: () => SessionContext,
  prepare: () => Promise<unknown>,
  commit: () => void,
): Promise<boolean> {
  const matches = () => {
    const current = read();
    return (
      current.authenticated &&
      current.userId === expected.userId &&
      current.version === expected.version
    );
  };
  if (!matches()) return false;
  await prepare();
  if (!matches()) return false;
  commit();
  return true;
}
