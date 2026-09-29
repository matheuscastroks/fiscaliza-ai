import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEMO_PRIMARY_ID } from './fixtures.ts';
import { createDemoRepository } from './repository.ts';
import type { DemoStorage } from './types.ts';

function memoryStorage(): DemoStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { values.set(key, value); },
    async removeItem(key) { values.delete(key); },
  };
}

const report = {
  title: 'Buraco na praça', description: 'Buraco próximo à entrada principal',
  category: 'road' as const, status: 'pending' as const, priority: 'high' as const,
  location: { latitude: -22.8, longitude: -43.2, address: 'Praça Central, 10' },
  images: [], reportedBy: 'demo-citizen',
};

test('cenários usam o mesmo relato principal com histórico coerente', async () => {
  const repo = createDemoRepository(memoryStorage(), 'scenario');
  assert.equal((await repo.get(DEMO_PRIMARY_ID))?.status, 'pending');
  await repo.reset('in_progress');
  assert.equal((await repo.get(DEMO_PRIMARY_ID))?.status, 'in_progress');
  assert.equal((await repo.get(DEMO_PRIMARY_ID))?.statusHistory.length, 2);
  await repo.reset('resolved');
  assert.equal((await repo.get(DEMO_PRIMARY_ID))?.status, 'resolved');
  assert.equal((await repo.get(DEMO_PRIMARY_ID))?.statusHistory.length, 3);
  assert.equal(await repo.getScenario(), 'resolved');
});

test('criação válida aparece em filtros combinados e sobrevive à recarga', async () => {
  const storage = memoryStorage();
  const repo = createDemoRepository(storage, 'reload');
  const created = await repo.create(report);
  assert.notEqual(created.id, DEMO_PRIMARY_ID);
  assert.equal(created.statusHistory[0].status, 'pending');
  const reloaded = createDemoRepository(storage, 'reload');
  assert.deepEqual((await reloaded.list({ status: 'pending', category: 'road', userId: 'demo-citizen' })).map(p => p.id).includes(created.id), true);
  assert.equal((await reloaded.get(created.id))?.title, report.title);
});

test('entrada inválida não cria relato', async () => {
  const repo = createDemoRepository(memoryStorage(), 'validation');
  await assert.rejects(repo.create({ ...report, title: '  ' }), /título/i);
  assert.equal((await repo.list()).length, 3);
});

test('status exige justificativa e acrescenta histórico sem perder campos', async () => {
  const repo = createDemoRepository(memoryStorage(), 'history');
  await assert.rejects(repo.update(DEMO_PRIMARY_ID, { status: 'resolved' }), /justificativa/i);
  const updated = await repo.update(DEMO_PRIMARY_ID, { status: 'in_progress', justification: 'Equipe designada' });
  assert.equal(updated.title, (await repo.get(DEMO_PRIMARY_ID))?.title);
  assert.equal(updated.statusHistory.at(-1)?.justification, 'Equipe designada');
  assert.equal((await repo.list({ status: 'in_progress' })).some(p => p.id === DEMO_PRIMARY_ID), true);
});

test('mutações simultâneas preservam ambos relatos e alterações', async () => {
  const repo = createDemoRepository(memoryStorage(), 'concurrent');
  const [first, second] = await Promise.all([repo.create(report), repo.create(report)]);
  assert.notEqual(first.id, second.id);
  await Promise.all([
    repo.update(first.id, { status: 'in_progress', justification: 'Em triagem' }),
    repo.update(second.id, { status: 'resolved', justification: 'Concluído' }),
  ]);
  assert.equal((await repo.get(first.id))?.status, 'in_progress');
  assert.equal((await repo.get(second.id))?.status, 'resolved');
});

test('reset descarta alterações apenas no escopo da chave escolhida', async () => {
  const storage = memoryStorage();
  const citizen = createDemoRepository(storage, 'citizen');
  const municipal = createDemoRepository(storage, 'municipal');
  const created = await citizen.create(report);
  await municipal.reset('resolved');
  assert.equal((await citizen.get(created.id))?.id, created.id);
  await citizen.reset('registered');
  assert.equal(await citizen.get(created.id), null);
  assert.equal((await municipal.get(DEMO_PRIMARY_ID))?.status, 'resolved');
});

test('payload corrompido é recuperado com aviso e sem expor dados inválidos', async () => {
  const storage = memoryStorage();
  storage.values.set('bad', '{oops');
  const repo = createDemoRepository(storage, 'bad');
  assert.equal((await repo.list()).length, 3);
  assert.match(repo.getWarning() ?? '', /inválid/i);
  assert.equal(storage.values.get('bad'), '{oops');
});

test('falha de escrita é propagada e não publica mutação na memória', async () => {
  const storage = memoryStorage();
  const repo = createDemoRepository(storage, 'write-error');
  await repo.list();
  storage.setItem = async () => { throw new Error('disco indisponível'); };
  await assert.rejects(repo.create(report), /disco indisponível/);
  assert.equal((await repo.list()).length, 3);
  await assert.rejects(repo.reset('resolved'), /disco indisponível/);
  assert.equal(await repo.getScenario(), 'registered');
});

test('retornos não permitem alterar o estado interno', async () => {
  const repo = createDemoRepository(memoryStorage(), 'copies');
  const problem = (await repo.get(DEMO_PRIMARY_ID))!;
  problem.location.address = 'alterado';
  problem.statusHistory.push({ status: 'resolved', at: '2000-01-01', justification: 'alterado' });
  assert.notEqual((await repo.get(DEMO_PRIMARY_ID))?.location.address, 'alterado');
  assert.equal((await repo.get(DEMO_PRIMARY_ID))?.statusHistory.length, 1);
});

test('votos e comentários simultâneos são mantidos na persistência', async () => {
  const storage = memoryStorage();
  const repo = createDemoRepository(storage, 'interactions');
  await Promise.all([repo.vote(DEMO_PRIMARY_ID), repo.vote(DEMO_PRIMARY_ID)]);
  await Promise.all([
    repo.comment(DEMO_PRIMARY_ID, 'demo-citizen', 'Pessoa de demonstração', 'Primeiro'),
    repo.comment(DEMO_PRIMARY_ID, 'demo-citizen', 'Pessoa de demonstração', 'Segundo'),
  ]);
  const reloaded = createDemoRepository(storage, 'interactions');
  assert.equal((await reloaded.get(DEMO_PRIMARY_ID))?.votes, 10);
  assert.deepEqual((await reloaded.get(DEMO_PRIMARY_ID))?.comments.map(c => c.text).sort(), ['Primeiro', 'Segundo']);
});
