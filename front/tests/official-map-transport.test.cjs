const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('map transport preserves filters and cancellation while excluding list pagination', async () => {
  const module = { exports: {} };
  let received;
  const result = { total: 610, locatedTotal: 600, unlocatedTotal: 10, visibleTotal: 600, cells: [] };
  const source = ts.transpileModule(fs.readFileSync('services/officialCalls.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, URLSearchParams,
    require: () => ({ request: async (...args) => { received = args; return result; } }),
  });
  const signal = new AbortController().signal;
  const params = { viewNorth: -22, viewSouth: -23, viewEast: -43, viewWest: -44,
    tipo: 'Iluminação', search: 'Lâmpada', tema: 'infraestrutura', situacao: 'Aberto',
    startDate: '2026-11-01', endDate: '2026-11-13', bairro: 'Centro',
    limit: 50, page: 2, cursor: 'old-list-cursor', includeTotal: false, hasCoordinates: true };
  assert.equal(await module.exports.fetchOfficialMap(params, signal), result);
  const url = new URL('http://local' + received[0]);
  assert.equal(url.pathname, '/rio1746/map');
  for (const key of ['tipo','search','tema','situacao','startDate','endDate','bairro','viewNorth','viewSouth','viewEast','viewWest']) assert.equal(url.searchParams.get(key), String(params[key]));
  for (const key of ['page','limit','cursor','includeTotal','hasCoordinates']) assert.equal(url.searchParams.has(key), false);
  assert.equal(received[3], signal);
});
