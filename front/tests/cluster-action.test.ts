import assert from 'node:assert/strict';
import test from 'node:test';
import { clusterAction, clusterZoomTarget } from '../features/territory/clusterAction.ts';

test('até 20 chamados viram cartões, de 21 a 30 abrem a lista e acima disso o mapa aproxima', () => {
  assert.equal(clusterAction(2, 13), 'carousel');
  assert.equal(clusterAction(20, 13), 'carousel');
  assert.equal(clusterAction(21, 13), 'list');
  assert.equal(clusterAction(30, 13), 'list');
  assert.equal(clusterAction(31, 13), 'zoom');
  assert.equal(clusterAction(5000, undefined), 'zoom');
});

test('no zoom máximo um grupo grande abre a lista em vez de aproximar para sempre', () => {
  assert.equal(clusterAction(400, 17), 'list');
  assert.equal(clusterZoomTarget(12), 14);
  assert.equal(clusterZoomTarget(16.5), 18);
  assert.equal(clusterZoomTarget(undefined), 13);
});
