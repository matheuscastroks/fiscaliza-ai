const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm'),
  ts = require('typescript');
test('abandoning a filter aborts its HTTP request and cleans up without a network failure', async () => {
  let receivedSignal, resolveResponse;
  const fetch = (_url, options) => {
    receivedSignal = options.signal;
    return new Promise((resolve, reject) => {
      resolveResponse = () =>
        resolve({
          status: 200,
          json: async () => ({ success: true, data: [] }),
        });
      options.signal.addEventListener(
        'abort',
        () => reject(new DOMException('cancelled', 'AbortError')),
        { once: true },
      );
    });
  };
  const source = ts.transpileModule(
    fs.readFileSync('services/http.ts', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const mod = { exports: {} };
  vm.runInNewContext('(function(require,module,exports){' + source + '\n})', {
    process: { env: {} },
    AbortController,
    DOMException,
    FormData,
    Error,
    TypeError,
    setTimeout,
    clearTimeout,
  })(
    (name) => {
      if (name === 'react-native') return { Platform: { OS: 'web' } };
      if (name === 'expo/fetch') return { fetch };
      if (name === 'expo-secure-store') return {};
      if (name === '@tanstack/react-query') return { QueryClient: class {} };
      throw Error(name);
    },
    mod,
    mod.exports,
  );
  const controller = new AbortController();
  const pending = mod.exports.request(
    '/read',
    'GET',
    undefined,
    controller.signal,
  );
  const handled = pending.catch((e) => e);
  try {
    controller.abort();
    assert.equal(receivedSignal.aborted, true);
    assert.equal((await handled).name, 'AbortError');
  } finally {
    resolveResponse();
    await handled;
  }
});

test('an already aborted native signal without reason still rejects with an AbortError', async () => {
  const source = ts.transpileModule(
    fs.readFileSync('services/http.ts', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const mod = { exports: {} };
  vm.runInNewContext('(function(require,module,exports){' + source + '\n})', {
    process: { env: {} },
    AbortController,
    FormData,
    Error,
    TypeError,
    setTimeout,
    clearTimeout,
  })(
    (name) => {
      if (name === 'react-native') return { Platform: { OS: 'web' } };
      if (name === 'expo/fetch')
        return {
          fetch: () => {
            throw Error('must not fetch');
          },
        };
      if (name === 'expo-secure-store') return {};
      if (name === '@tanstack/react-query') return { QueryClient: class {} };
      throw Error(name);
    },
    mod,
    mod.exports,
  );
  await assert.rejects(
    mod.exports.request('/read', 'GET', undefined, {
      aborted: true,
      reason: undefined,
    }),
    (error) => error?.name === 'AbortError',
  );
});
