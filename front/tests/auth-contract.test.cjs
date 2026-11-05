const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('authentication preserves the API user without fabricated game statistics', async () => {
  const user = { id: 'citizen', name: 'Pessoa', email: 'person@test.invalid', role: 'citizen', municipality: null };
  const requests = [];
  const tokens = [];
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('services/auth.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext('(function(require,module,exports){' + source + '\n})')((name) => {
    assert.equal(name, './http');
    return {
      request: async (path, method, body) => {
        requests.push({ path, method, body });
        return path === '/auth/me' ? user : { user, token: 'session-token' };
      },
      saveToken: async token => tokens.push(token),
    };
  }, module, module.exports);
  const api = module.exports.authApi;
  assert.equal((await api.login(user.email, 'password')).data, user);
  assert.equal((await api.register({ name: user.name, email: user.email, password: 'password' })).data, user);
  assert.equal((await api.getCurrentUser()).data, user);
  assert.deepEqual(tokens, ['session-token', 'session-token']);
  assert.deepEqual(requests.map(r => r.path), ['/auth/login', '/auth/register', '/auth/me']);
  for (const field of ['points', 'ranking', 'badges', 'level']) assert.equal(field in user, false);
});
