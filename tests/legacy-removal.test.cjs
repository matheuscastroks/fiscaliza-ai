const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('retired participation routes cannot be opened by file based routing', () => {
  for (const route of ['ProposalScreen', 'CivicDetailsScreen', 'ProblemDetailsScreen', 'HistoryScreen', 'HistoricalDetailsScreen', 'RelatedScreen', 'CityScreen', 'PresentationScreen', '(tabs)/ReportScreen', '(tabs)/ProblemsListScreen']) {
    assert.equal(fs.existsSync(`app/${route}.tsx`), false, route);
  }
  const profile = fs.readFileSync('app/(tabs)/ProfileScreen.tsx', 'utf8');
  assert.equal(profile.includes('/activity'), false);
  const api = fs.readFileSync('backend/src/app.ts', 'utf8');
  assert.equal(api.includes('registerCivicRoutes'), false);
  assert.ok(api.includes('registerOfficialCallsRoutes(app'));
  assert.ok(api.includes('registerPublicDataRoutes(app'));
});
