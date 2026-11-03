const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { QueryClient } = require('@tanstack/react-query');

test('infinite calls refresh on stale focus while keeping every loaded page', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  const filters = { situacao: 'Encerrado', limit: 50 };
  const key = ['officialCallsPages', filters];
  const pages = { pages: [
    { calls: [{ id: 'first' }], hasMore: true, nextCursor: 'next' },
    { calls: [{ id: 'second' }], hasMore: false },
  ], pageParams: [undefined, 'next'] };
  client.setQueryData(key, pages);
  let focus;
  let refreshes = 0;
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('features/city/useOfficialCalls.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext('(function(require,module,exports){' + source + '\n})', { JSON, Date })((name) => {
    if (name === 'react') return { useCallback: fn => fn, useMemo: fn => fn() };
    if (name === 'expo-router') return { useFocusEffect: fn => { focus = fn; } };
    if (name === '@tanstack/react-query') return {
      useQueryClient: () => client,
      useInfiniteQuery: () => ({ data: client.getQueryData(key), refetch: async () => { refreshes++; } }),
    };
    if (name === '@/services/officialCalls' || name === '@/features/territory/mapPerformance') return {};
    throw new Error(name);
  }, mod, mod.exports);
  try {
    const result = mod.exports.useInfiniteOfficialCalls(filters);
    assert.equal(result.data.calls.length, 2);
    focus();
    assert.equal(refreshes, 0, 'fresh pages are reused');
    client.setQueryData(key, pages, { updatedAt: Date.now() - 31_000 });
    focus();
    assert.equal(refreshes, 1, 'stale pages refresh on return');
    assert.equal(client.getQueryData(key).pages.length, 2, 'focus does not reset pagination');
    await client.invalidateQueries({ queryKey: key, refetchType: 'none' });
    focus();
    assert.equal(refreshes, 2, 'invalidated pages refresh');
    mod.exports.useInfiniteOfficialCalls(filters, false);
    focus();
    assert.equal(refreshes, 2, 'hidden layer does not refresh');
  } finally { client.clear(); }
});

test('returning to a screen reuses fresh query data and fetches after invalidation', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  let focus,
    calls = 0,
    overviewCalls = 0;
  const source = ts.transpileModule(
    fs.readFileSync('features/city/useOfficialCalls.ts', 'utf8'),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    },
  ).outputText;
  const mod = { exports: {} };
  vm.runInNewContext('(function(require,module,exports){' + source + '\n})')(
    (name) => {
      if (name === '@/features/territory/mapPerformance') return {};
      if (name === 'react')
        return { useCallback: (fn) => fn, useMemo: (fn) => fn() };
      if (name === 'expo-router')
        return {
          useFocusEffect: (fn) => {
            focus = fn;
          },
        };
      if (name === '@tanstack/react-query')
        return { useQuery: () => ({}), useQueryClient: () => client };
      if (name === '@/services/officialCalls')
        return {
          fetchOfficialCalls: async () => ({ calls: [], total: ++calls }),
          fetchOfficialOverview: async () => ({ totalCalls: ++overviewCalls }),
        };
      throw Error(name);
    },
    mod,
    mod.exports,
  );
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  try {
    mod.exports.useOfficialCalls({ bairro: 'Centro' });
    focus();
    await flush();
    focus();
    await flush();
    assert.equal(calls, 1, 'focus must honor the fresh cache');
    await client.invalidateQueries({
      queryKey: ['officialCalls'],
      refetchType: 'none',
    });
    focus();
    await flush();
    assert.equal(calls, 2, 'invalidated data must reload');
    mod.exports.useOfficialCalls({ bairro: 'Tijuca' });
    focus();
    await flush();
    assert.equal(calls, 3, 'different filters must have separate cache');
    mod.exports.useOfficialCalls({ bairro: 'Centro' }, false);
    focus();
    await flush();
    assert.equal(calls, 3, 'disabled screen must not fetch');
    mod.exports.useOfficialOverview();
    focus();
    await flush();
    focus();
    await flush();
    assert.equal(overviewCalls, 1);
  } finally {
    client.clear();
  }
});
