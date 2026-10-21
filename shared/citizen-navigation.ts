const PUBLIC = new Set([
  '',
  'OfficialCallDetailsScreen',
  'FacilityDetailsScreen',
  'NeighborhoodScreen',
  'ResultsScreen',
  'CityScreen',
  'LoginScreen',
  'AboutScreen',
  'HelpScreen',
  'OnboardingScreen',
  'SettingsScreen',
]);
const TABS = new Set([
  'index',
  'TerritoryScreen',
  'ParticipateScreen',
  'FollowScreen',
]);
export function isPublicCitizenRoute(segments: readonly string[]): boolean {
  return segments[0] === '(tabs)'
    ? TABS.has(segments[1] || 'index')
    : PUBLIC.has(segments[0] || '');
}
