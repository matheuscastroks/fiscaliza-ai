import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { hashPassword, verifyPassword } from '../src/auth.js';
import { analyze } from '../src/analysis.js';

test('password verification rejects a different password', async () => {
  const hash = await hashPassword('pass-123');
  assert.equal(await verifyPassword('pass-123', hash), true);
  assert.equal(await verifyPassword('other', hash), false);
});
test('API rejects unauthenticated mutations and malformed login without a database', async (t) => {
  const app = await buildApp();
  t.after(() => app.close());
  const unauthorized = await app.inject({
    method: 'POST',
    url: '/api/occurrences',
    payload: {},
  });
  assert.equal(unauthorized.statusCode, 401);
  assert.equal(unauthorized.json().success, false);
  const invalid = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'a' },
  });
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.json().success, false);
});
test('cookies require an allowed Origin for writes', async (t) => {
  const app = await buildApp();
  t.after(() => app.close());
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/logout',
    headers: { cookie: 'session=example', origin: 'https://evil.test' },
  });
  assert.equal(response.statusCode, 403);
  const citizen = await app.inject({
    method: 'POST',
    url: '/api/auth/logout',
    headers: {
      cookie: 'citizen_session=example',
      'x-fiscaliza-client': 'citizen',
      origin: 'https://evil.test',
    },
  });
  assert.equal(citizen.statusCode, 403);
});
test('AI without key returns deterministic heuristic suggestion', async () => {
  const value = await analyze(
    { description: 'Lâmpada apagada na rua' },
    undefined,
  );
  assert.equal(value.analysisSource, 'heuristic');
  assert.equal(value.suggestedCategory, 'lighting');
});
test('browser preflight permits participation mutations and client headers', async (t) => {
  const app = await buildApp();
  t.after(() => app.close());
  for (const method of ['PUT', 'PATCH', 'DELETE']) {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/api/occurrences/example/support',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': method,
        'access-control-request-headers': 'x-fiscaliza-client',
      },
    });
    assert.equal(response.statusCode, 204);
    assert.ok(
      response.headers['access-control-allow-methods']
        ?.toString()
        .includes(method),
    );
    assert.ok(
      response.headers['access-control-allow-headers']
        ?.toString()
        .includes('x-fiscaliza-client'),
    );
  }
});
test('health and OpenAPI are available without database connection', async (t) => {
  const app = await buildApp();
  t.after(() => app.close());
  assert.equal((await app.inject('/health')).statusCode, 200);
  await app.ready();
  assert.ok(app.swagger().paths?.['/api/auth/login']);
});
test('rate limits trust forwarded IP only from the configured proxy', async (t) => {
  const previous = process.env.TRUST_PROXY;
  process.env.TRUST_PROXY = '127.0.0.1';
  const app = await buildApp();
  if (previous === undefined) delete process.env.TRUST_PROXY;
  else process.env.TRUST_PROXY = previous;
  t.after(() => app.close());
  const request = (remoteAddress: string, ip: string) =>
    app.inject({
      url: '/health',
      remoteAddress,
      headers: { 'x-forwarded-for': ip },
    });
  const a = await request('127.0.0.1', '198.51.100.1'),
    b = await request('127.0.0.1', '198.51.100.2'),
    a2 = await request('127.0.0.1', '198.51.100.1');
  assert.equal(
    a.headers['x-ratelimit-remaining'],
    b.headers['x-ratelimit-remaining'],
  );
  assert.equal(
    Number(a2.headers['x-ratelimit-remaining']),
    Number(a.headers['x-ratelimit-remaining']) - 1,
  );
  const direct = await request('203.0.113.1', '198.51.100.3'),
    spoof = await request('203.0.113.1', '198.51.100.4');
  assert.equal(
    Number(spoof.headers['x-ratelimit-remaining']),
    Number(direct.headers['x-ratelimit-remaining']) - 1,
  );
});
