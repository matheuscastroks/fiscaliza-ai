const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    { module, exports: module.exports },
  );
  return module.exports;
}
test('public citizen journeys include preferences but never legacy writes or profiles', () => {
  const { isPublicCitizenRoute: publicRoute } = load(
    'shared/citizen-navigation.ts',
  );
  for (const segments of [
    [],
    ['(tabs)'],
    ['(tabs)', 'FollowScreen'],
    ['(tabs)', 'ParticipateScreen'],
    ['SettingsScreen'],
    ['OfficialCallDetailsScreen'],
  ])
    assert.equal(publicRoute(segments), true);
  for (const segments of [
    ['(tabs)', 'ReportScreen'],
    ['(tabs)', 'ProfileScreen'],
    ['ProposalScreen'],
    ['PresentationScreen'],
    ['MunicipalityScreen'],
    ['ProfileScreen'],
  ])
    assert.equal(publicRoute(segments), false);
});
test('administrative closure never mistakes Não Encerrado for closed', () => {
  const { isOfficialCallClosed: closed } = load(
    'shared/official-call-state.ts',
  );
  for (const officialSituation of ['Não Encerrado', 'Em andamento', null])
    assert.equal(closed({ officialSituation }), false);
  for (const officialSituation of ['Encerrado', 'Encerrada', 'Fechado'])
    assert.equal(closed({ officialSituation }), true);
  assert.equal(closed({ closedAt: '2026-10-20' }), true);
});
