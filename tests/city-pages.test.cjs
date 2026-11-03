const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { QueryClient } = require('@tanstack/react-query');

test('municipal pages preserve filters, scope, cancellation and page boundaries', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  let options;
  let user = { id: 'citizen-a', municipality: { id: '3304557' } };
  const requests = [];
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('features/city/useCityPages.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext('(function(require,module,exports){' + source + '\n})')((name) => {
    if (name === 'react') return { useCallback: fn => fn, useMemo: fn => fn() };
    if (name === 'expo-router') return { useFocusEffect: () => {} };
    if (name === '@tanstack/react-query') return {
      useQueryClient: () => client,
      useInfiniteQuery: value => { options = value; return {}; },
    };
    if (name === '@/stores/authStore') return { useAuthStore: select => select({ user, isAuthenticated: true }) };
    if (name === '@/services/http') return { request: async (url, _method, _body, signal) => {
      requests.push({ url, signal });
      const offset = Number(new URL(url, 'http://test').searchParams.get('offset'));
      return Array.from({ length: offset === 0 ? 50 : 3 }, (_, i) => ({ id: String(offset + i) }));
    } };
    throw new Error(name);
  }, mod, mod.exports);
  try {
    mod.exports.useCityPages('/occurrences?status=resolved&order=votes&search=buraco');
    const first = await client.fetchInfiniteQuery(options);
    assert.equal(first.pages.length, 1);
    assert.equal(first.pages[0].length, 50);
    assert.ok(requests[0].signal instanceof AbortSignal);
    assert.match(requests[0].url, /status=resolved&order=votes&search=buraco&limit=50&offset=0$/);
    const offset = options.getNextPageParam(first.pages[0], first.pages, 0);
    assert.equal(offset, 50);
    const second = await options.queryFn({ pageParam: offset, signal: new AbortController().signal });
    assert.equal(second.length, 3);
    assert.equal(options.getNextPageParam(second, [], offset), undefined);
    const key = JSON.stringify(options.queryKey);
    user = { ...user, id: 'citizen-b' };
    mod.exports.useCityPages('/occurrences?status=resolved&order=votes&search=buraco');
    assert.notEqual(JSON.stringify(options.queryKey), key);
    mod.exports.useCityPages('/occurrences?status=pending');
    assert.equal(options.initialPageParam, 0);
    mod.exports.useCityPages('/occurrences', false);
    assert.equal(options.enabled, false);
  } finally { client.clear(); }
});
