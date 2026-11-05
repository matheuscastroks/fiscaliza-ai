const { readFileSync } = require('node:fs');
const { setTimeout: delay } = require('node:timers/promises');
const { GitHubApi } = require('./github-api.cjs');
const defaultPolicy = require('../automation-policy.json');
const shaPattern = /^[a-f0-9]{40}$/;
const blocked = reason => ({ status: 'blocked', reason });

function eligibleRun(run, repo, policy) {
  return repo.id === policy.repositoryId && repo.owner?.id === policy.ownerId &&
    repo.default_branch === policy.baseBranch &&
    run.repository?.id === policy.repositoryId && run.head_repository?.id === policy.repositoryId &&
    run.actor?.id === policy.ownerId && run.triggering_actor?.id === policy.ownerId &&
    run.event === 'push' && run.status === 'completed' && run.conclusion === 'success' &&
    typeof run.head_branch === 'string' && run.head_branch !== policy.baseBranch &&
    shaPattern.test(run.head_sha) && Number.isSafeInteger(run.run_attempt) && run.run_attempt > 0;
}

function completeJobs(jobs, policy) {
  return policy.requiredJobs.every(name => {
    const matching = jobs.filter(job => job.name === name);
    return matching.length === 1 && matching[0].status === 'completed' && matching[0].conclusion === 'success';
  });
}

async function protectedMain(api, prefix, policy) {
  const rules = await api.all(`${prefix}/rules/branches/${encodeURIComponent(policy.baseBranch)}`);
  const strict = rules.find(rule => rule.type === 'required_status_checks' &&
    rule.parameters?.strict_required_status_checks_policy === true &&
    rule.parameters.required_status_checks?.some(check => check.context === policy.checkName && check.integration_id === policy.actionsAppId));
  if (!strict || !rules.some(rule => rule.type === 'pull_request' && rule.ruleset_id === strict.ruleset_id)) return false;
  const ruleset = await api.get(`${prefix}/rulesets/${strict.ruleset_id}`);
  // GitHub omits bypass_actors without Administration permission. The runtime
  // token cannot audit that field; setup configures no bypass, and merges use
  // the normal endpoint subject to GitHub's effective native rules.
  return ruleset.enforcement === 'active' &&
    (ruleset.bypass_actors === undefined || (Array.isArray(ruleset.bypass_actors) && ruleset.bypass_actors.length === 0));
}

function allowedPr(pr, repo, run, policy, marker) {
  const owner = pr.user?.id === policy.ownerId;
  const ownBot = pr.user?.id === 41898282 && pr.user?.login === 'github-actions[bot]' && pr.body?.includes(marker);
  return (owner || ownBot) && pr.base?.ref === policy.baseBranch &&
    pr.base.repo?.id === repo.id && pr.head?.repo?.id === repo.id && pr.head.sha === run.head_sha;
}

async function release(api, prefix, policy) {
  const main = await api.get(`${prefix}/git/ref/heads/${policy.baseBranch}`);
  const workflow = encodeURIComponent(policy.releaseWorkflow);
  const existing = await api.all(`${prefix}/actions/workflows/${workflow}/runs?head_sha=${main.object.sha}`, 'workflow_runs');
  if (existing.some(run => run.status !== 'completed' || run.conclusion === 'success')) return 'already-requested';
  await api.post(`${prefix}/actions/workflows/${workflow}/dispatches`, { ref: policy.baseBranch });
  return 'requested';
}

async function autoMerge({ api, repository, runId, policy = defaultPolicy, sleep = delay }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !Number.isSafeInteger(runId) || runId < 1) throw new Error('Repositório ou execução inválidos.');
  const prefix = '/repos/' + repository;
  const repo = await api.get(prefix);
  const run = await api.get(`${prefix}/actions/runs/${runId}`);
  if (!eligibleRun(run, repo, policy)) return blocked('Execução não é um push autorizado do proprietário com CI completo.');
  const workflow = await api.get(`${prefix}/actions/workflows/${encodeURIComponent(policy.ciWorkflow)}`);
  if (run.workflow_id !== workflow.id) return blocked('Workflow diferente do CI obrigatório.');
  const jobs = await api.all(`${prefix}/actions/runs/${runId}/attempts/${run.run_attempt}/jobs`, 'jobs');
  if (!completeJobs(jobs, policy)) return blocked('Há jobs obrigatórios ausentes, duplicados, incompletos ou sem sucesso.');
  if (!await protectedMain(api, prefix, policy)) return blocked('Configure o ruleset de main: PR, CI gate estrito e nenhum bypass. Consulte .github/README.md.');
  const marker = `<!-- fiscaliza-auto:${policy.repositoryId}:${policy.ownerId} -->`;
  const prs = await api.all(`${prefix}/pulls?state=all&base=${policy.baseBranch}&head=${encodeURIComponent(repo.owner.login + ':' + run.head_branch)}`);
  const previous = prs.find(pr => pr.merged_at && allowedPr(pr, repo, run, policy, marker));
  if (previous) return { status: 'already-merged', release: await release(api, prefix, policy) };

  const branchPath = `${prefix}/git/ref/heads/${encodeURIComponent(run.head_branch)}`;
  const current = await api.get(branchPath);
  if (current.object.sha !== run.head_sha) return blocked('A branch mudou depois do CI; aguardando a execução atual.');
  const main = await api.get(`${prefix}/git/ref/heads/${policy.baseBranch}`);
  const comparison = await api.get(`${prefix}/compare/${main.object.sha}...${run.head_sha}`);
  if (comparison.behind_by !== 0 || comparison.status !== 'ahead') return blocked('Atualize a branch com main e envie novamente; não haverá force push automático.');
  let pr = prs.find(item => item.state === 'open');
  if (!pr && prs.some(item => item.state === 'closed' && item.head.sha === run.head_sha)) return blocked('PR desse commit foi encerrado; respeitando a decisão do usuário.');
  if (!pr) {
    pr = await api.post(`${prefix}/pulls`, {
      head: run.head_branch, base: policy.baseBranch, title: `Integra ${run.head_branch}`,
      body: `${marker}\n\nPush autorizado do proprietário. Todos os jobs obrigatórios passaram no commit ${run.head_sha}.\n\nCI: https://github.com/${repository}/actions/runs/${runId}`,
    });
  }
  if (pr.draft || !allowedPr(pr, repo, run, policy, marker)) return blocked('PR é rascunho, de outro autor ou não corresponde ao commit validado.');
  for (let attempt = 0; attempt < 3; attempt++) {
    pr = await api.get(`${prefix}/pulls/${pr.number}`);
    if (pr.mergeable !== null) break;
    await sleep(2000);
  }
  if (pr.state !== 'open' || pr.draft || !allowedPr(pr, repo, run, policy, marker) || pr.mergeable !== true) return blocked('PR mudou, está bloqueado ou possui conflito.');
  if ((await api.get(branchPath)).object.sha !== run.head_sha) return blocked('Um push mais recente substituiu o commit aprovado.');
  // GitHub enforces strict native checks atomically; expected SHA protects concurrent pushes.
  const result = await api.put(`${prefix}/pulls/${pr.number}/merge`, { sha: run.head_sha, merge_method: 'squash' });
  if (result.merged !== true || !shaPattern.test(result.sha)) throw new Error('GitHub não confirmou o merge. Nenhuma release foi solicitada.');
  return { status: 'merged', sha: result.sha, pull: pr.number, release: await release(api, prefix, policy) };
}

async function main() {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  if (event.repository?.id !== defaultPolicy.repositoryId || event.repository?.owner?.id !== defaultPolicy.ownerId) throw new Error('Evento de outro repositório.');
  const runId = Number(event.workflow_run?.id ?? event.inputs?.run_id);
  const result = await autoMerge({ api: new GitHubApi(process.env.GITHUB_TOKEN), repository: process.env.GITHUB_REPOSITORY, runId });
  console.log(JSON.stringify(result));
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { autoMerge, eligibleRun, completeJobs };
