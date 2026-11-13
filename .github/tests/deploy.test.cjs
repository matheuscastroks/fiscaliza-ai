const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
const shellPath = (p) => p.replaceAll('\\', '/').replace(/^([A-Za-z]):/, (_, drive) => '/' + drive.toLowerCase());

function simulate(failBackup) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fiscaliza-deploy-test-'));
  const sha = 'a'.repeat(40);
  const release = path.join(root, 'releases', sha, 'deploy');
  fs.mkdirSync(release, { recursive: true });
  fs.writeFileSync(path.join(root, '.env.production'), '');
  const script = path.join(release, 'deploy.sh');
  fs.writeFileSync(script, fs.readFileSync('deploy/deploy.sh', 'utf8').replaceAll('\r\n', '\n'));
  const trace = path.join(root, 'trace');
  const mocks = path.join(root, 'mocks.sh');
  fs.writeFileSync(mocks, `docker() {
  printf '%s\\n' "$*" >> "$TRACE"
  case "$*" in
    *BACKUP_ONCE=1*) [ "$FAIL_BACKUP" != 1 ] || return 42 ;;
    *'printenv PUBLIC_DOMAIN'*) printf 'example.test\\n' ;;
  esac
}
curl() { return 0; }
flock() { return 0; }
`);
  const result = spawnSync(bash, [shellPath(script), 'ghcr.io/example/fiscaliza', sha], {
    encoding: 'utf8', env: { ...process.env, BASH_ENV: shellPath(mocks), TRACE: shellPath(trace), FAIL_BACKUP: failBackup ? '1' : '0' },
  });
  return { result, commands: fs.readFileSync(trace, 'utf8').trim().split('\n'), published: fs.existsSync(path.join(root, 'current-release')) };
}

test('deploy completes a one-shot backup before starting migrating services', () => {
  const { result, commands, published } = simulate(false);
  assert.equal(result.status, 0, result.stderr);
  const backup = commands.findIndex((line) => line.includes('BACKUP_ONCE=1'));
  const rollout = commands.findIndex((line) => line.includes('--remove-orphans'));
  assert.ok(backup >= 0 && backup < rollout, commands.join('\n'));
  assert.ok(published);
});

test('backup failure prevents migrations and does not publish current-release', () => {
  const { result, commands, published } = simulate(true);
  assert.equal(result.status, 42, result.stderr);
  assert.ok(!commands.some((line) => line.includes('--remove-orphans')));
  assert.equal(published, false);
});
