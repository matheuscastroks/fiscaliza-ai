const { GitHubApi } = require('./github-api.cjs');
const policy = require('../automation-policy.json');
const ruleset = require('../rulesets/main.json');

async function configure(api) {
  const prefix = `/repos/${policy.ownerLogin}/fiscaliza-ai`;
  const user = await api.get('/user');
  const repo = await api.get(prefix);
  if (user.id !== policy.ownerId || repo.id !== policy.repositoryId || !repo.permissions?.admin) {
    throw new Error('Execute com credencial de administração do proprietário esperado.');
  }
  const existing = await api.all(`${prefix}/rulesets`);
  const managed = existing.filter(item => item.name === ruleset.name && item.source_type === 'Repository');
  if (managed.length > 1) throw new Error('Rulesets duplicados; confira no GitHub antes de continuar.');
  await api.put(`${prefix}/actions/permissions/workflow`, {
    default_workflow_permissions: 'read', can_approve_pull_request_reviews: true,
  });
  if (managed.length) await api.put(`${prefix}/rulesets/${managed[0].id}`, ruleset);
  else await api.post(`${prefix}/rulesets`, ruleset);
  console.log('Actions e ruleset configurados. Outros rulesets foram preservados.');
}
if (require.main === module) configure(new GitHubApi(process.env.GH_TOKEN || process.env.GITHUB_TOKEN))
  .catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { configure };
