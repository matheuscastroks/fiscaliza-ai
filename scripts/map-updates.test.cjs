const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
function harness() {
  const source = fs.readFileSync('components/ui/OsmMapView.tsx', 'utf8');
  const match = source.match(
    /    function updateMarkers\(markers, selectedId, clusterIds\) \{[\s\S]*?\n    \}\n\n    updateMarkers/,
  );
  assert.ok(match);
  const scheduled = [];
  const counts = { created: 0, cleared: 0, icons: 0, removed: 0, added: 0 };
  const context = {
    setTimeout: (fn) => scheduled.push(fn),
    pendingMarkerAdditions: Object.create(null),
    markerAdditionScheduled: false,
    markersMap: Object.create(null),
    markerDataMap: Object.create(null),
    currentSelectedId: null,
    currentSelectedClusterIds: [],
    createMarkerIcon: () => ({}),
    postAppMessage: () => {},
    document: { createElement: () => ({ textContent: '' }) },
    clusterGroup: {
      clearLayers() {
        counts.cleared++;
      },
      addLayers(items) {
        counts.added += items.length;
      },
      removeLayers(items) {
        counts.removed += items.length;
      },
      refreshClusters() {},
    },
    L: {
      marker() {
        counts.created++;
        return {
          on() {
            return this;
          },
          bindTooltip() {
            return this;
          },
          setTooltipContent() {},
          setIcon() {
            counts.icons++;
          },
          setZIndexOffset() {},
          setLatLng() {},
        };
      },
      DomEvent: { stopPropagation() {} },
    },
  };
  vm.createContext(context);
  vm.runInContext(match[0].replace(/\n\n    updateMarkers$/, ''), context);
  const flush = () => {
    while (scheduled.length) scheduled.shift()();
  };
  return {
    counts,
    updateRaw: context.updateMarkers,
    flush,
    update: (...args) => {
      context.updateMarkers(...args);
      flush();
    },
  };
}
const markers = Array.from({ length: 300 }, (_, i) => ({
  id: String(i),
  latitude: -22.9 + i * 0.0001,
  longitude: -43.2,
  title: 'Registro ' + i,
  kind: 'official',
  color: '#0072BB',
}));
test('selecting a map item reuses 300 existing markers instead of rebuilding the layer', () => {
  const h = harness();
  h.update(markers, null, []);
  h.update(markers, '10', []);
  assert.equal(h.counts.created, 300);
  assert.equal(h.counts.cleared, 0);
  assert.equal(h.counts.icons, 1);
});
test('changing a filter only removes missing markers and inserts new records', () => {
  const h = harness();
  h.update(markers, null, []);
  h.update([...markers.slice(1), { ...markers[0], id: 'new' }], null, []);
  assert.equal(h.counts.created, 301);
  assert.equal(h.counts.removed, 1);
  assert.equal(h.counts.cleared, 0);
});
test('identical marker updates do not touch icons or cluster contents', () => {
  const h = harness();
  h.update(markers, null, []);
  h.update(
    markers.map((x) => ({ ...x })),
    null,
    [],
  );
  assert.equal(h.counts.created, 300);
  assert.equal(h.counts.icons, 0);
  assert.equal(h.counts.added, 300);
});

test('bulk marker insertion yields between batches and a newer filter discards queued old markers', () => {
  const h = harness();
  h.updateRaw(markers, null, []);
  assert.ok(h.counts.added <= 50, 'initial batch must be bounded');
  h.updateRaw([], null, []);
  const before = h.counts.added;
  h.flush();
  assert.equal(
    h.counts.added,
    before,
    'queued removed markers must never be added',
  );
});
