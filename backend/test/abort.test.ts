import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connect } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { buildApp } from '../src/app.js';
import { database } from '../src/db.js';
import { seed } from '../src/seed-data.js';

test(
  'PostgreSQL/TCP: aborted JSON, uploads and lock waiters do not block the next mutation',
  { skip: !process.env.DATABASE_URL, timeout: 60000 },
  async (t) => {
    const { db, pool } = database();
    const app = await buildApp();
    t.after(async () => {
      await app.close();
      await pool.end();
    });
    let arrived: (() => void) | undefined;
    let disconnected: (() => void) | undefined;
    app.addHook('onRequest', async (req) => {
      if (req.headers['x-abort-test']) {
        req.raw.once('aborted', () => disconnected?.());
        arrived?.();
      }
    });
    await seed(db);
    await pool.query(
      "UPDATE users SET municipality_id='3304557' WHERE id='citizen-ana'",
    );
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'beatrizarante@gmail.com',
        password: process.env.DEMO_PASSWORD || 'Fiscaliza123!',
      },
    });
    const token = login.json().data.token as string;
    const headers = { authorization: `Bearer ${token}` };
    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    assert.ok(address && typeof address !== 'string');
    const countLocks = async () => {
      const result = await pool.query(
        "SELECT count(*)::int AS n FROM pg_locks WHERE locktype='advisory' AND granted AND database=(SELECT oid FROM pg_database WHERE datname=current_database()) AND objid=(hashtext('citizen-ana')::bigint & 4294967295)::oid",
      );
      return result.rows[0].n as number;
    };
    const waitFor = async (condition: () => Promise<boolean>) => {
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) {
        if (await condition()) return;
        await delay(25);
      }
      assert.fail('Timed out waiting for lock state');
    };
    const send = async (
      path: string,
      contentType: string,
      fragment: string,
      length: number,
    ) => {
      const seen = new Promise<void>((resolve) => {
        arrived = resolve;
      });
      const aborted = new Promise<void>((resolve) => {
        disconnected = resolve;
      });
      const socket = connect(address.port, '127.0.0.1');
      socket.on('error', () => {});
      socket.write(
        `POST ${path} HTTP/1.1\r\nHost: localhost\r\nAuthorization: Bearer ${token}\r\nX-Abort-Test: true\r\nContent-Type: ${contentType}\r\nContent-Length: ${length}\r\n\r\n${fragment}`,
      );
      await seen;
      return { socket, aborted };
    };
    const nextMutation = async () => {
      const response = await Promise.race([
        app.inject({
          method: 'POST',
          url: '/api/occurrences/occ-iluminacao-centro/comments',
          headers,
          payload: { text: 'After disconnected request' },
        }),
        delay(15000, undefined, { ref: false }).then(() => {
          throw new Error('Next mutation blocked by an abandoned lock');
        }),
      ]);
      assert.equal(response.statusCode, 200, response.body);
      assert.equal(await countLocks(), 0);
    };
    const json = await send('/api/analysis', 'application/json', '{', 100);
    json.socket.destroy();
    await json.aborted;
    assert.equal(
      await countLocks(),
      0,
      'JSON parsing must not acquire a profile lock',
    );
    await nextMutation();

    const upload = await send(
      '/api/attachments',
      'multipart/form-data; boundary=abort-upload',
      '--abort-upload\r\nContent-Disposition: form-data; name="file"; filename="partial.png"\r\nContent-Type: image/png\r\n\r\npartial',
      100000,
    );
    await waitFor(async () => (await countLocks()) === 1);
    upload.socket.destroy();
    await upload.aborted;
    await waitFor(async () => (await countLocks()) === 0);
    await nextMutation();

    // A complete body may wait behind another mutation when its socket closes.
    const blocker = await pool.connect();
    try {
      await blocker.query("SELECT pg_advisory_lock(hashtext('citizen-ana'))");
      const waiter = await send(
        '/api/analysis',
        'application/json',
        '{"description":"aborted while waiting"}',
        39,
      );
      await waitFor(async () => {
        const result = await pool.query(
          "SELECT count(*)::int AS n FROM pg_locks WHERE locktype='advisory' AND NOT granted AND database=(SELECT oid FROM pg_database WHERE datname=current_database()) AND objid=(hashtext('citizen-ana')::bigint & 4294967295)::oid",
        );
        return result.rows[0].n > 0;
      });
      waiter.socket.destroy();
      await delay(25);
      await blocker.query("SELECT pg_advisory_unlock(hashtext('citizen-ana'))");
      await waitFor(async () => (await countLocks()) === 0);
      await nextMutation();
    } finally {
      await blocker.query('SELECT pg_advisory_unlock_all()');
      blocker.release();
    }
  },
);
