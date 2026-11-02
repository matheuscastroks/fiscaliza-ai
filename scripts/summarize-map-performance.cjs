const fs = require('node:fs');

function summarizeMapPerformance(log) {
  const traces = new Map();
  for (const line of log.split('\n')) {
    const offset = line.indexOf('[map-perf]');
    if (offset < 0) continue;
    let event;
    try { event = JSON.parse(line.slice(offset + '[map-perf]'.length).trim()); }
    catch { continue; }
    const key = `${event.session}:${event.variant}:${event.trace}`;
    if (event.event === 'start') traces.set(key, { variant: event.variant, origin: event.origin, samples: {} });
    const trace = traces.get(key);
    if (trace && Number.isFinite(event.elapsedMs) && !(event.event in trace.samples)) {
      trace.samples[event.event] = event.elapsedMs;
    }
  }
  const groups = new Map();
  for (const trace of traces.values()) {
    const key = `${trace.variant}/${trace.origin}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(trace);
  }
  return [...groups].map(([scenario, visits]) => {
    const metric = event => {
      const values = visits.map(t => t.samples[event]).filter(Number.isFinite).sort((a, b) => a - b);
      const percentile = p => values.length ? values[Math.ceil(values.length * p) - 1] : null;
      return { samples: values.length, p50Ms: percentile(0.5), p95Ms: percentile(0.95) };
    };
    return { scenario, visits: visits.length, focus: metric('focus'), commit: metric('commit'), frame: metric('frame-ready') };
  });
}
module.exports = { summarizeMapPerformance };
if (require.main === module) {
  if (!process.argv[2]) throw new Error('Usage: node scripts/summarize-map-performance.cjs <log-file>');
  process.stdout.write(JSON.stringify(summarizeMapPerformance(fs.readFileSync(process.argv[2], 'utf8')), null, 2) + '\n');
}
