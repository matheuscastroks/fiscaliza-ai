/** Opt-in diagnostics. Never record locations, query parameters or user data. */
const enabled = process.env.EXPO_PUBLIC_MAP_PERF === '1';
export const mapPerformanceEnabled = enabled;
const requestedVariant = process.env.EXPO_PUBLIC_MAP_PERF_VARIANT;
export const mapPerformanceVariant = enabled &&
  ['visible-surface', 'unfrozen', 'retained-map'].includes(requestedVariant || '')
  ? requestedVariant : 'baseline';

type EventName = 'focus' | 'commit' | 'blur' | 'mount' | 'unmount' |
  'style-loaded' | 'frame-ready' | 'load-error' | 'calls-start' | 'calls-end' |
  'calls-error' | 'geojson-ready' | 'points-committed' | 'module-ready';
type Event = { trace: number; event: EventName | 'start'; elapsedMs: number; durationMs?: number; count?: number; origin?: string };
let nextTrace = 0;
let active: { id: number; start: number; seen: Set<string> } | undefined;
const events: Event[] = [];
const session = Date.now().toString(36);
const now = () => performance.now();
function record(event: Event) {
  events.push(event);
  if (events.length > 1000) events.shift();
  console.info('[map-perf]', JSON.stringify({ session, variant: mapPerformanceVariant, ...event }));
}
export function beginMapTrace(origin: 'tab' | 'direct' | 'focus-only' | 'list-to-map') {
  if (!enabled) return;
  active = { id: ++nextTrace, start: now(), seen: new Set() };
  record({ trace: active.id, event: 'start', elapsedMs: 0, origin });
}
export function mapTraceId(): number | null { return enabled ? active?.id ?? null : null; }
export function mapPerformanceEvent(event: EventName, detail: { durationMs?: number; count?: number } = {}, trace = mapTraceId()) {
  if (!enabled || !active || trace !== active.id) return;
  if (['focus', 'commit', 'frame-ready'].includes(event)) {
    if (active.seen.has(event)) return;
    active.seen.add(event);
  }
  record({ trace: active.id, event, elapsedMs: Math.round((now() - active.start) * 100) / 100, ...detail });
}
export function endMapTrace(trace = mapTraceId()) {
  if (trace !== active?.id) return;
  mapPerformanceEvent('blur', {}, trace);
  active = undefined;
}
export function readMapPerformanceEvents() { return events.map(event => ({ ...event })); }
