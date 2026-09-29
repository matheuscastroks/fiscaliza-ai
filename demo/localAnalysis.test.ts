import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyzeLocally } from './localAnalysis.ts';

test('análise local classifica descrição de iluminação sem acessar serviços', () => {
  const result = analyzeLocally({ description: 'Poste apagado deixa a rua escura', imageUri: 'file:///foto.jpg' });
  assert.equal(result.suggestedCategory, 'lighting');
  assert.match(result.imageAnalysis ?? '', /não analisada/i);
  assert.equal(result.analysisSource, 'simulação local');
});

test('análise local prioriza risco e mantém a descrição informada', () => {
  const result = analyzeLocally({ description: 'Buraco perigoso na travessia' });
  assert.equal(result.suggestedCategory, 'road');
  assert.equal(result.suggestedPriority, 'high');
  assert.equal(result.suggestedDescription, 'Buraco perigoso na travessia');
});
