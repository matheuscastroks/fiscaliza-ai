const { test } = require('node:test');
const assert = require('node:assert/strict');
const policy = require('../automation-policy.json');
const { autoMerge } = require('../scripts/auto-merge.cjs');
const head = 'a'.repeat(40);
const base = 'b'.repeat(40);
const merged = 'c'.repeat(40);
function fixture(change = () => {}) {
  const repo = { id: policy.repositoryId, owner: { id: policy.ownerId, login: policy.ownerLogin }, default_branch: 'main' };
  const run = { id: 10, workflow_id: 20, run_attempt: 1, event: 'push', status: 'completed', conclusion: 'success', actor: { id: policy.ownerId }, triggering_actor: { id: policy.ownerId }, repository: repo, head_repository: repo, head_branch: 'feat/example', head_sha: head };
  const rules = [ { type: 'required_status_checks', ruleset_id: 30, parameters: { strict_required_status_checks_policy: true, required_status_checks: [{ context: 'CI gate', integration_id: policy.actionsAppId }] } }, { type: 'pull_request', ruleset_id: 30 } ];
  const state = { repo, run, rules, ruleset: { enforcement: 'active', bypass_actors: [] }, jobs: policy.requiredJobs.map(name => ({ name, status: 'completed', conclusion: 'success' })), branchSha: head, baseSha: base, behind: 0, prs: [], writes: [], dispatches: 0 };
  change(state);
  const api = {
    async get(path) {
      if (path === '/repos/matheuscastroks/fiscaliza-ai') return state.repo;
      if (path.endsWith('/actions/runs/10')) return state.run;
      if (path.endsWith('/actions/workflows/validate.yml')) return { id: 20 };
      if (path.endsWith('/git/ref/heads/main')) return { object: { sha: state.baseSha } };
      if (path.includes('/git/ref/heads/')) return { object: { sha: state.branchSha } };
      if (path.includes('/compare/')) return { status: state.behind ? 'diverged' : 'ahead', behind_by: state.behind };
      if (path.endsWith('/rulesets/30')) return state.ruleset;
      if (path.endsWith('/pulls/1')) return state.prs[0];
      throw new Error('Unexpected GET ' + path);
    },
    async all(path) {
      if (path.includes('/attempts/')) return state.jobs;
      if (path.includes('/rules/branches/')) return state.rules;
      if (path.includes('/pulls?')) return state.prs;
      if (path.includes('/actions/workflows/release.yml/runs')) return state.releases || [];
      throw new Error('Unexpected LIST ' + path);
    },
    async post(path, body) {
      state.writes.push({ method: 'POST', path, body });
      if (path.endsWith('/pulls')) {
        const pr = { number: 1, state: 'open', draft: false, user: { id: 41898282, login: 'github-actions[bot]', type: 'Bot' }, body: body.body, base: { ref: 'main', repo }, head: { sha: head, repo }, mergeable: true };
        state.prs.push(pr); return pr;
      }
      if (path.endsWith('/dispatches')) { state.dispatches++; return; }
      throw new Error('Unexpected POST ' + path);
    },
    async put(path, body) {
      state.writes.push({ method: 'PUT', path, body });
      assert.equal(body.sha, head);
      assert.equal(body.merge_method, 'squash');
      if (state.race) throw new Error('409: head changed');
      return { merged: true, sha: merged };
    },
  };
  return { state, execute: () => autoMerge({ api, repository: 'matheuscastroks/fiscaliza-ai', runId: 10, policy, sleep: async () => {} }) };
}
test('owner push with every job green creates a PR, merges the exact SHA and dispatches release', async () => {
  const f = fixture(); const result = await f.execute();
  assert.equal(result.status, 'merged'); assert.equal(result.sha, merged);
  assert.equal(f.state.dispatches, 1);
  assert.equal(f.state.writes.filter(x => x.path.endsWith('/pulls')).length, 1);
});
for (const [name, change] of [
  ['another authenticated actor', s => s.run.actor.id++],
  ['a rerun requested by someone else', s => s.run.triggering_actor.id++],
  ['a fork', s => s.run.head_repository = { id: 1 }],
  ['another repository', s => s.repo.id++],
  ['failed CI', s => s.run.conclusion = 'failure'],
  ['cancelled CI', s => s.run.conclusion = 'cancelled'],
  ['PR event instead of a user push', s => s.run.event = 'pull_request'],
  ['a push to main', s => s.run.head_branch = 'main'],
  ['an uncompleted job', s => s.jobs[0].status = 'in_progress'],
  ['a skipped job', s => s.jobs[0].conclusion = 'skipped'],
  ['a missing mandatory job', s => s.jobs.pop()],
  ['a duplicate mandatory job', s => s.jobs.push(s.jobs[0])],
  ['a superseded branch head', s => s.branchSha = base],
  ['a branch behind main', s => s.behind = 1],
  ['missing rules', s => s.rules = []],
  ['non-strict status checks', s => s.rules[0].parameters.strict_required_status_checks_policy = false],
  ['a check from another app', s => s.rules[0].parameters.required_status_checks[0].integration_id++],
  ['ruleset bypass', s => s.ruleset.bypass_actors = [{ actor_id: 5 }]],
  ['disabled ruleset', s => s.ruleset.enforcement = 'disabled'],
]) test('does not write to GitHub for ' + name, async () => {
  const f = fixture(change); const result = await f.execute();
  assert.equal(result.status, 'blocked'); assert.equal(f.state.writes.length, 0);
});
test('a changed head during merge never triggers release', async () => {
  const f = fixture(s => s.race = true);
  await assert.rejects(f.execute(), /409/); assert.equal(f.state.dispatches, 0);
});
test('a draft PR remains a draft and is never merged', async () => {
  const f = fixture();
  f.state.prs.push({ number: 1, state: 'open', draft: true, user: { id: policy.ownerId }, base: { ref: 'main', repo: f.state.repo }, head: { sha: head, repo: f.state.repo } });
  assert.equal((await f.execute()).status, 'blocked'); assert.equal(f.state.writes.length, 0);
});
test('a PR authored by another person is never merged', async () => {
  const f = fixture();
  f.state.prs.push({ number: 1, state: 'open', draft: false, user: { id: 123 }, base: { ref: 'main', repo: f.state.repo }, head: { sha: head, repo: f.state.repo } });
  assert.equal((await f.execute()).status, 'blocked'); assert.equal(f.state.writes.length, 0);
});
test('rules metadata with hidden bypass list works without Administration access', async () => {
  const f = fixture(s => delete s.ruleset.bypass_actors);
  assert.equal((await f.execute()).status, 'merged');
});
test('recovery after merge only requests the missing release', async () => {
  const f = fixture();
  f.state.prs.push({ number: 1, state: 'closed', merged_at: '2026-11-05', user: { id: policy.ownerId }, base: { ref: 'main', repo: f.state.repo }, head: { sha: head, repo: f.state.repo } });
  const result = await f.execute();
  assert.equal(result.status, 'already-merged');
  assert.equal(f.state.writes.length, 1);
  assert.match(f.state.writes[0].path, /dispatches$/);
});
test('a successful existing release is not dispatched twice', async () => {
  const f = fixture(s => s.releases = [{ status: 'completed', conclusion: 'success' }]);
  assert.equal((await f.execute()).release, 'already-requested');
  assert.equal(f.state.dispatches, 0);
});
test('a closed unmerged PR is respected', async () => {
  const f = fixture(s => s.prs = [{ state: 'closed', head: { sha: head } }]);
  assert.equal((await f.execute()).status, 'blocked');
  assert.equal(f.state.writes.length, 0);
});
