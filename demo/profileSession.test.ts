import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCurrentProfile } from '../shared/profile-session.ts';

test('resposta de perfil não restaura logout nem substitui outra conta ou novo login', async () => {
  for (const current of [
    { userId: undefined, version: 2, authenticated: false },
    { userId: 'B', version: 2, authenticated: true },
    { userId: 'A', version: 3, authenticated: true },
  ]) {
    let touched = false;
    assert.equal(
      await applyCurrentProfile(
        { userId: 'A', version: 1 },
        () => current,
        async () => {
          touched = true;
        },
        () => {
          touched = true;
        },
      ),
      false,
    );
    assert.equal(touched, false);
  }
});
test('sessão encerrada durante cancelamento de cache impede aplicar perfil tardio', async () => {
  const current = { userId: 'A', version: 1, authenticated: true };
  let committed = false;
  const result = await applyCurrentProfile(
    { userId: 'A', version: 1 },
    () => current,
    async () => {
      current.version++;
      current.authenticated = false;
    },
    () => {
      committed = true;
    },
  );
  assert.equal(result, false);
  assert.equal(committed, false);
});
test('perfil da sessão atual só é aplicado após preparar o cache', async () => {
  const order: string[] = [];
  assert.equal(
    await applyCurrentProfile(
      { userId: 'A', version: 1 },
      () => ({ userId: 'A', version: 1, authenticated: true }),
      async () => {
        order.push('cancel');
      },
      () => {
        order.push('commit');
      },
    ),
    true,
  );
  assert.deepEqual(order, ['cancel', 'commit']);
});
