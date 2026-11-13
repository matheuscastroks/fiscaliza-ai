export function routeId(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= 200 &&
    value.trim() === value && !/[\s/\\]/u.test(value)
    ? value : null;
}
