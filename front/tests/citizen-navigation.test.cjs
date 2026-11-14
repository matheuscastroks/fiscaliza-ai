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
test('territorial discovery and local places remain accessible without authentication', () => {
  const { isPublicCitizenRoute: publicRoute } = load(
    '../shared/citizen-navigation.ts',
  );
  for (const segments of [
    ['calls', '[id]'],
    ['facilities', '[id]'],
    ['neighborhoods', '[id]'],
    ['LoginScreen'],
    ['RegisterScreen'],
    ['AboutScreen'],
    ['HelpScreen'],
    ['OnboardingScreen'],
    [],
    ['(tabs)'],
    ['(tabs)', 'index'],
    ['(tabs)', 'TerritoryScreen'],
    ['(tabs)', 'FollowScreen'],
    ['(tabs)', 'ParticipateScreen'],
    ['(tabs)', 'ProfileScreen'],
    ['+not-found'],
    ['SettingsScreen'],
    ['PlacesScreen'],
    ['OfficialCallDetailsScreen'],
    ['FacilityDetailsScreen'],
    ['NeighborhoodScreen'],
  ])
    assert.equal(publicRoute(segments), true);
  for (const segments of [
    ['(tabs)', 'ReportScreen'],
    ['ProposalScreen'],
    ['PresentationScreen'],
    ['MunicipalityScreen'],
    ['ProfileScreen'],
  ])
    assert.equal(publicRoute(segments), false);
});
test('administrative closure never mistakes Não Encerrado for closed', () => {
  const { isOfficialCallClosed: closed } = load(
    '../shared/official-call-state.ts',
  );
  for (const officialSituation of ['Não Encerrado', 'Em andamento', null])
    assert.equal(closed({ officialSituation }), false);
  for (const officialSituation of ['Encerrado', 'Encerrada', 'Fechado'])
    assert.equal(closed({ officialSituation }), true);
  assert.equal(closed({ closedAt: '2026-10-20' }), true);
});
test('legacy gamified routes and redundant stores are removed', () => {
  for (const legacyFile of [
    'app/RankingScreen.tsx',
    'app/PointsGuideScreen.tsx',
    'stores/problemsStore.ts',
    'stores/statsStore.ts',
  ]) {
    assert.equal(fs.existsSync(legacyFile), false, `${legacyFile} should not exist`);
  }
  const layout = fs.readFileSync('app/_layout.tsx', 'utf8');
  assert.equal(layout.includes('RankingScreen'), false);
  assert.equal(layout.includes('PointsGuideScreen'), false);
});
