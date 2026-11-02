const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function transport(response, onExpired) {
  const module = { exports: {} };
  const source = ts.transpileModule(
    fs.readFileSync('services/http.ts', 'utf8'),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    },
  ).outputText;
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    process: { env: {} },
    AbortController,
    FormData,
    Error,
    TypeError,
    setTimeout,
    clearTimeout,
    require(name) {
      if (name === 'expo/fetch') return { fetch: async () => response };
      if (name === 'expo-secure-store')
        return { deleteItemAsync: async () => {} };
      if (name === '@tanstack/react-query') return { QueryClient: class {} };
      throw new Error(name);
    },
  });
  if (onExpired) module.exports.onSessionExpired(onExpired);
  return module.exports.request;
}

test('proxy errors never surface raw JSON parser messages as password errors', async () => {
  const request = transport({
    status: 530,
    json: async () => {
      throw new SyntaxError('JSON Parse error: Unexpected character: e');
    },
  });
  await assert.rejects(
    request('/auth/login', 'POST', {}),
    /serviço está temporariamente indisponível/i,
  );
});

test('invalid JSON and unexpected envelopes have a recovery message', async () => {
  for (const json of [
    async () => {
      throw new SyntaxError('Unexpected token <');
    },
    async () => null,
    async () => ({ token: 'bad-envelope' }),
  ]) {
    await assert.rejects(
      transport({ status: 200, json })('/auth/login', 'POST', {}),
      /resposta inválida/i,
    );
  }
});

test('valid API authentication errors retain the server message', async () => {
  const request = transport({
    status: 401,
    json: async () => ({ success: false, error: 'E-mail ou senha inválidos.' }),
  });
  await assert.rejects(
    request('/auth/login', 'POST', {}),
    /E-mail ou senha inválidos/,
  );
});

test('unauthorized protected responses expire the session even with a malformed body', async () => {
  for (const json of [
    async () => null,
    async () => ({}),
    async () => {
      throw new SyntaxError('invalid body');
    },
  ]) {
    let expired = 0;
    const request = transport({ status: 401, json }, () => {
      expired++;
    });
    await assert.rejects(request('/auth/me'), /resposta inválida/i);
    assert.equal(expired, 1);
  }
});
