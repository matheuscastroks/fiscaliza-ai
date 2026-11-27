import assert from 'node:assert/strict';
import test from 'node:test';
import { COMPLAINT_STEPS, formatComplaintMessage } from '../features/city/complaintMessage.ts';
import { COMPLAINT_TOPIC_IDS, isComplaintTopicId } from '../../shared/complaint-draft.ts';

test('mensagem do 1746 traz assunto, local, detalhes e avisa a foto anexada', () => {
  const text = formatComplaintMessage({
    topicLabel: 'Buraco na rua',
    address: ' Rua A, 10 ',
    description: ' Buraco grande. ',
    hasPhoto: true,
  });
  assert.equal(
    text,
    'Olá! Quero pedir um serviço pelo 1746:\n\n• Assunto: Buraco na rua\n• Onde: Rua A, 10\n• Detalhes: Buraco grande.\n• Foto do local em anexo',
  );
  const empty = formatComplaintMessage({ topicLabel: 'Outro', address: '', description: '', hasPhoto: false });
  assert.match(empty, /endereço a especificar/);
  assert.match(empty, /Solicitação de reparo/);
  assert.doesNotMatch(empty, /Foto/);
});

test('fluxo tem três passos: foto, revisão e confirmação', () => {
  assert.deepEqual(COMPLAINT_STEPS, ['photo', 'details', 'confirm']);
});

test('assuntos sugeridos pela IA são os mesmos do seletor do app', async () => {
  const { readFileSync } = await import('node:fs');
  const sheet = readFileSync(new URL('../features/city/ComplaintTopicSheet.tsx', import.meta.url), 'utf8');
  const ids = [...sheet.matchAll(/id: '([a-z]+)'/g)].map((match) => match[1]);
  assert.deepEqual(ids, [...COMPLAINT_TOPIC_IDS]);
  assert.equal(isComplaintTopicId('ponte'), false);
});
