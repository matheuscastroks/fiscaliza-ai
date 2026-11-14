import assert from 'node:assert/strict';
import test from 'node:test';
import { routeId } from '../utils/routeId.ts';

test('route identifiers reject ambiguous and malformed input', () => {
  for (const value of [undefined, '', ' ', ['one', 'two'], 'a/b', 'a\\b', 'a\n', 'x'.repeat(201)]) assert.equal(routeId(value), null);
  assert.equal(routeId('rio1746:123'), 'rio1746:123');
  assert.equal(routeId('bairro-1'), 'bairro-1');
});
