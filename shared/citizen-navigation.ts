const PUBLIC = new Set([
  'LoginScreen',
  'AboutScreen',
  'HelpScreen',
  'OnboardingScreen',
]);
export function isPublicCitizenRoute(segments: readonly string[]): boolean {
  return segments[0] ? PUBLIC.has(segments[0]) : false;
}
