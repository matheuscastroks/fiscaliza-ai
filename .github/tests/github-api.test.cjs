const { test } = require('node:test');
const assert = require('node:assert/strict');
const { GitHubApi } = require('../scripts/github-api.cjs');
const { configure } = require('../scripts/configure-repository.cjs');
const policy = require('../automation-policy.json');

test('pagination preserves query and collects all pages', async () => {
  const urls = [];
  const api = new GitHubApi('test-secret', async url => {
    urls.push(url);
    return { ok: true, status: 200, json: async () => ({ jobs: urls.length === 1 ? Array(100).fill(1) : [2] }) };
  });
  assert.equal((await api.all('/jobs?filter=latest', 'jobs')).length, 101);
  assert.match(urls[1], /filter=latest&per_page=100&page=2$/);
});
test('HTTP failures expose status without response content or credentials', async () => {
  const api = new GitHubApi('test-secret', async () => ({ ok: false, status: 403 }));
  await assert.rejects(api.get('/repos/example/repo'), error => error.status === 403 && !error.message.includes('test-secret'));
  await assert.rejects(api.get('//outside.example'), /inválido/);
});
test('repository setup refuses another user before any write', async () => {
  const api = { get: async path => path === '/user' ? { id: 123 } : { id: policy.repositoryId, permissions: { admin: true } } };
  await assert.rejects(configure(api), /proprietário/);
});
test('repository setup updates its own ruleset and preserves unrelated rules', async () => {
  const writes = [];
  const api = {
    get: async path => path === '/user' ? { id: policy.ownerId } : { id: policy.repositoryId, permissions: { admin: true } },
    all: async () => [{ id: 1, name: 'Other', source_type: 'Repository' }, { id: 2, name: 'Main CI owner', source_type: 'Repository' }],
    put: async (path, body) => writes.push({ path, body }),
  };
  await configure(api);
  assert.equal(writes.length, 2);
  assert.match(writes[1].path, /rulesets\/2$/);
  assert.deepEqual(writes[1].body.bypass_actors, []);
  assert.equal(writes[0].body.default_workflow_permissions, 'read');
});
