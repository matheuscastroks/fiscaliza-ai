const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function uploader({ exists = true, status = 200, body = { success: true, data: { url: '/api/attachments/photo' } } } = {}) {
  let options, released = false;
  class File {
    constructor(uri) { this.uri = uri; this.exists = exists; }
    createUploadTask(url, config) { options = { url, config }; return {
      uploadAsync: async () => ({ status, body: JSON.stringify(body) }),
      cancel() {}, release() { released = true; },
    }; }
  }
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('services/http.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const run = vm.runInNewContext('(function(require,module,exports){'+code+'\n})', { process: { env: {} }, AbortController, Error, TypeError, setTimeout, clearTimeout });
  run((name) => {
    if (name === 'expo-file-system') return { File, UploadType: { MULTIPART: 1 } };
    if (name === '@tanstack/react-query') return { QueryClient: class {} };
    if (name === 'expo/fetch' || name === 'expo-secure-store') return {};
    throw Error('Unexpected module: ' + name);
  }, mod, mod.exports);
  return { upload: mod.exports.uploadImage, options: () => options, released: () => released };
}

test('photo upload uses multipart and releases the native task on success', async () => {
  const api = uploader();
  assert.equal(await api.upload('file:///photo.jpg'), '/api/attachments/photo');
  assert.equal(api.options().config.fieldName, 'file');
  assert.equal(api.options().config.uploadType, 1);
  assert.equal(api.released(), true);
});

test('missing photo does not start a request', async () => {
  const api = uploader({ exists: false });
  await assert.rejects(api.upload('file:///missing.jpg'), /não está mais disponível/);
  assert.equal(api.options(), undefined);
});

test('rejected upload preserves server message and releases task', async () => {
  const api = uploader({ status: 413, body: { success: false, error: 'Foto grande demais.' } });
  await assert.rejects(api.upload('file:///photo.jpg'), /Foto grande demais/);
  assert.equal(api.released(), true);
});
