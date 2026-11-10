import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { inArray } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';
import { importPartition } from '../src/integrations/rio1746/importer.js';
import { applyMigrations } from '../src/migrations.js';
import { officialCalls } from '../src/schema.js';
import { bigQueryFixture } from './bigquery-fixture.js';
import { createCitizen } from './helpers.js';

const row = (id: string) => ({
  id_chamado: id,
  data_inicio: '2026-09-20T10:00:00',
  tipo: 'Iluminação Pública',
  subtipo: 'Reparo de luminária',
  status: 'Aberto',
  situacao: 'Não Encerrado',
  latitude: -22.91,
  longitude: -43.2,
  nome_bairro: 'Centro',
  data_particao: '2026-09-20',
});

test(
  'PostgreSQL: chamados salvos pertencem à conta, aparecem em outro aparelho e saem com ela',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const app = await buildApp();
    const { db, pool } = database();
    const ext = [randomUUID(), randomUUID(), randomUUID()];
    t.after(async () => {
      await db.delete(officialCalls).where(inArray(officialCalls.externalId, ext));
      await app.close();
      await pool.end();
    });
    await applyMigrations(pool);
    await importPartition(
      bigQueryFixture(() => ext.map(row)),
      db,
      '2026-09-20',
      { pageSize: 10 },
    );
    const ids = ext.map((id) => `rio1746-${id}`);

    const a = await createCitizen(app, db);
    const b = await createCitizen(app, db);
    const call = (user: typeof a, method: 'GET' | 'PUT' | 'DELETE' | 'POST', url: string, payload?: object) =>
      app.inject({ method, url: `/api/v1/saved-calls${url}`, headers: user.headers, payload });

    assert.equal(
      (await app.inject({ method: 'GET', url: '/api/v1/saved-calls' })).statusCode,
      401,
    );
    assert.equal((await call(a, 'PUT', `/${ids[0]}`)).statusCode, 200);
    assert.equal((await call(a, 'PUT', `/${ids[0]}`)).statusCode, 200); // idempotente
    assert.equal((await call(a, 'PUT', '/rio1746-nao-existe')).statusCode, 404);
    const merged = await call(a, 'POST', '/merge', { callIds: [ids[1], ids[2], 'rio1746-nao-existe'] });
    assert.equal(merged.json().data.added, 2);

    // "Outro aparelho": mesma conta, nova sessão.
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      remoteAddress: '203.0.113.77',
      payload: { email: a.email, password: 'Senha-de-teste-123' },
    });
    const other = { headers: { authorization: `Bearer ${login.json().data.token}` } } as unknown as typeof a;
    const list = (await call(other, 'GET', '')).json().data.items as Array<{ call: { id: string } }>;
    assert.deepEqual(list.map((item) => item.call.id).sort(), [...ids].sort());

    // Outra conta não vê nada e não mexe na lista alheia.
    assert.deepEqual((await call(b, 'GET', '')).json().data.items, []);
    await call(b, 'DELETE', `/${ids[0]}`);
    assert.equal((await call(a, 'GET', '')).json().data.items.length, 3);

    await call(a, 'DELETE', `/${ids[0]}`);
    assert.equal((await call(a, 'GET', '')).json().data.items.length, 2);
    await call(a, 'DELETE', '');
    assert.equal((await call(a, 'GET', '')).json().data.items.length, 0);
  },
);
