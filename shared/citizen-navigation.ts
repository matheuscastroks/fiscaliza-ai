const PUBLIC = new Set([
  'LoginScreen',
  'RegisterScreen',
  'AboutScreen',
  'HelpScreen',
  'OnboardingScreen',
  'SettingsScreen',
  'PlacesScreen',
  'OfficialCallDetailsScreen',
  'FacilityDetailsScreen',
  'NeighborhoodScreen',
  'ResultsScreen',
  '+not-found',
]);
export function isPublicCitizenRoute(segments: readonly string[]): boolean {
  if (!segments[0]) return true;
  if (segments[0] === '(tabs)')
    return (
      !segments[1] ||
      [
        'index',
        'TerritoryScreen',
        'FollowScreen',
        'ParticipateScreen',
        'ProfileScreen',
      ].includes(segments[1])
    );
  return PUBLIC.has(segments[0]);
}
