const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { summarizeMapPerformance } = require('../scripts/summarize-map-performance.cjs');

test('summary separates runs and variants and never turns missing frames into zero', () => {
  const event = (session, variant, name, elapsedMs) => '[map-perf] ' + JSON.stringify({ session, variant, trace: 1, origin: 'tab', event: name, elapsedMs });
  const report = summarizeMapPerformance([
    event('a', 'baseline', 'start', 0), event('a', 'baseline', 'frame-ready', 2000),
    event('b', 'baseline', 'start', 0), event('b', 'baseline', 'frame-ready', 300),
    event('b', 'unfrozen', 'start', 0), '[map-perf] malformed',
  ].join('\n'));
  assert.equal(report[0].frame.p95Ms, 2000);
  assert.equal(report[0].frame.p50Ms, 300);
  assert.equal(report[1].frame.p95Ms, null);
  assert.equal(report[1].frame.samples, 0);
});

function load(enabled = true, variant = 'baseline') {
  let clock = 0;
  const mod = { exports: {} };
  const logs = [];
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('features/territory/mapPerformance.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, {
    exports: mod.exports, module: mod,
    performance: { now: () => clock },
    process: { env: { EXPO_PUBLIC_MAP_PERF: enabled ? '1' : '0', EXPO_PUBLIC_MAP_PERF_VARIANT: variant } },
    console: { info: (...args) => logs.push(args) },
  });
  return { ...mod.exports, logs, tick: (ms) => { clock += ms; } };
}

test('screen lifecycle closes each visit and preserves a newly started list-to-map trace', () => {
  const perf = load();
  const states = [], effects = [], pending = [];
  let cursor = 0;
  const hooks = {
    useState(initial) {
      const i = cursor++;
      if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
      return [states[i], value => { states[i] = value; }];
    },
    useEffect(fn, deps) {
      const i = cursor++;
      const previous = effects[i];
      if (!previous || !deps || deps.some((d, n) => d !== previous.deps[n])) {
        pending.push(() => {
          previous?.cleanup?.();
          effects[i] = { deps, cleanup: fn() };
        });
      }
    },
  };
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('features/territory/useMapPerformance.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, {
    module: mod, exports: mod.exports,
    require: name => name === 'react' ? hooks : perf,
    requestIdleCallback: () => 1, cancelIdleCallback() {},
  });
  const render = (focused, list) => {
    cursor = 0;
    const result = mod.exports.useMapPerformance(focused, list);
    while (pending.length) pending.shift()();
    return result;
  };
  perf.beginMapTrace('tab');
  render(true, false);
  const first = perf.mapTraceId();
  render(true, true);
  assert.equal(perf.mapTraceId(), null);
  perf.beginMapTrace('list-to-map');
  const second = perf.mapTraceId();
  const result = render(true, false);
  assert.equal(result.visitTrace, second);
  assert.notEqual(second, first);
  render(false, false);
  assert.equal(perf.mapTraceId(), null);
  render(true, false);
  assert.equal(perf.readMapPerformanceEvents().filter(e => e.event === 'start').at(-1).origin, 'focus-only');
});
test('map diagnostics are opt-in and experiments cannot affect normal builds', () => {
  const perf = load(false, 'unfrozen');
  perf.beginMapTrace('tab');
  perf.mapPerformanceEvent('focus');
  assert.equal(perf.mapTraceId(), null);
  assert.equal(perf.logs.length, 0);
  assert.equal(perf.mapPerformanceVariant, 'baseline');
  assert.equal(load(true, 'invalid').mapPerformanceVariant, 'baseline');
});
test('map traces measure navigation and deduplicate frame callbacks', () => {
  const perf = load();
  perf.beginMapTrace('tab');
  perf.tick(12);
  perf.mapPerformanceEvent('focus');
  perf.tick(23);
  perf.mapPerformanceEvent('frame-ready');
  perf.mapPerformanceEvent('frame-ready');
  const events = perf.readMapPerformanceEvents();
  assert.equal(events.length, 3);
  assert.equal(events[2].elapsedMs, 35);
  events[0].origin = 'modified';
  assert.equal(perf.readMapPerformanceEvents()[0].origin, 'tab');
});
test('late requests from a previous visit cannot contaminate a new trace', () => {
  const perf = load();
  const noTrace = perf.mapTraceId();
  perf.beginMapTrace('tab');
  const old = perf.mapTraceId();
  perf.endMapTrace();
  perf.beginMapTrace('direct');
  perf.mapPerformanceEvent('calls-end', { count: 50 }, noTrace);
  perf.endMapTrace(old);
  assert.ok(perf.mapTraceId());
  perf.mapPerformanceEvent('calls-end', { count: 50 }, old);
  assert.ok(!perf.readMapPerformanceEvents().some(e => e.event === 'calls-end'));
  for (let i = 0; i < 1100; i++) perf.mapPerformanceEvent('geojson-ready');
  assert.equal(perf.readMapPerformanceEvents().length, 1000);
});
