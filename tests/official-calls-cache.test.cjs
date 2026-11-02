const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { QueryClient } = require('@tanstack/react-query');

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
