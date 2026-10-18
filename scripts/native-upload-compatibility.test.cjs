const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function evaluate(path, dependencies, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const result = { exports: {} };
  const factory = vm.runInNewContext(
    '(function(require,module,exports){' + source + '\n})',
    {
      Blob,
      Uint8Array,
      TextEncoder,
      AbortController,
      setTimeout,
      clearTimeout,
      process: {
        env: { EXPO_PUBLIC_API_URL: 'http://upload.test.invalid/api' },
      },
      ...globals,
    },
  );
  factory(
    (name) => {
      if (!(name in dependencies))
        throw Error('Unexpected dependency: ' + name);
      return dependencies[name];
    },
    result,
    result.exports,
  );
  return result.exports;
}
const converter = evaluate(
  'node_modules/expo/src/winter/fetch/convertFormData.ts',
  {
    '../../utils/blobUtils': {
      blobToArrayBufferAsync: (blob) => blob.arrayBuffer(),
    },
  },
).convertFormDataAsync;

test('installed Expo reproduces the legacy URI descriptor error', async () => {
  await assert.rejects(
    () =>
      converter({
        entries: () => [
          [
            'file',
            { uri: 'file:///photo.jpg', name: 'photo.jpg', type: 'image/jpeg' },
          ],
        ],
      }),
    /Unsupported FormDataPart implementation/,
  );
});

function nativeHttp(uploadResponse, exists = true) {
  const calls = [];
  const http = evaluate(
    'services/http.ts',
    {
      'react-native': { Platform: { OS: 'android' } },
      'expo-file-system/legacy': {
        getInfoAsync: async (uri) => {
          calls.push({ info: uri });
          return { exists };
        },
        FileSystemUploadType: { MULTIPART: 1 },
        createUploadTask: (url, uri, options) => {
          calls.push({ url, uri, options });
          return {
            uploadAsync: async () => uploadResponse,
            cancelAsync: async () => {},
          };
        },
      },
      'expo-secure-store': {
        setItemAsync: async () => {},
        deleteItemAsync: async () => {},
      },
      '@tanstack/react-query': { QueryClient: class {} },
      'expo/fetch': {
        fetch: () => {
          throw Error('Native uploads must bypass the JS multipart encoder');
        },
      },
    },
    { FormData: undefined, File: undefined },
  );
  return { http, calls };
}

test('native upload works without File/FormData constructors and preserves auth and multipart contract', async () => {
  const { http, calls } = nativeHttp({
    status: 200,
    body: JSON.stringify({
      success: true,
      data: { url: '/api/attachments/photo-id' },
    }),
  });
  await http.saveToken('test-token');
  assert.equal(
    await http.uploadImage('file:///photo.jpg'),
    '/api/attachments/photo-id',
  );
  assert.equal(calls[1].url, 'http://upload.test.invalid/api/attachments');
  assert.equal(calls[1].uri, 'file:///photo.jpg');
  assert.equal(calls[1].options.uploadType, 1);
  assert.equal(calls[1].options.fieldName, 'file');
  assert.equal(calls[1].options.httpMethod, 'POST');
  assert.equal(calls[1].options.headers.Authorization, 'Bearer test-token');
  assert.equal(calls[1].options.headers['Content-Type'], undefined);
});

test('native upload propagates server rejection and expires an unauthorized session', async () => {
  const { http } = nativeHttp({
    status: 401,
    body: JSON.stringify({ success: false, error: 'Sessão expirada' }),
  });
  let expired = false;
  http.onSessionExpired(() => {
    expired = true;
  });
  await assert.rejects(
    () => http.uploadImage('file:///photo.jpg'),
    /Sessão expirada/,
  );
  assert.equal(expired, true);
});

test('native upload rejects a missing photo before starting transport', async () => {
  const { http, calls } = nativeHttp(undefined, false);
  await assert.rejects(
    () => http.uploadImage('file:///deleted.jpg'),
    /não está mais disponível/,
  );
  assert.equal(calls.length, 1);
});

test('native upload handles a canceled task and durable URLs without reconstructing files', async () => {
  const { http, calls } = nativeHttp(undefined);
  await assert.rejects(
    () => http.uploadImage('file:///photo.jpg'),
    /interrompido/,
  );
  assert.equal(
    await http.uploadImage('/api/attachments/existing'),
    '/api/attachments/existing',
  );
  assert.equal(calls.length, 2);
});
