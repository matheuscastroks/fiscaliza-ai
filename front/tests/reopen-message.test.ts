import assert from 'node:assert/strict';
import test from 'node:test';
import { formatReopenMessage } from '../features/city/reopenMessage.ts';

test('pedido de novo cita o protocolo anterior e como o chamado foi encerrado', () => {
  const text = formatReopenMessage({
    protocol: '24002878',
    service: 'Reparo de buraco na pista ',
    place: 'Rua A · Laranjeiras',
    closedOn: '12/10/2026',
    closingNote: ' Serviço executado. ',
  });
  assert.equal(
    text,
    'Olá! Quero pedir de novo um serviço pelo 1746. O chamado anterior foi encerrado em 12/10/2026, mas o problema continua no local.\n\n' +
      '• Protocolo anterior: 24002878\n• Serviço: Reparo de buraco na pista\n• Onde: Rua A · Laranjeiras\n' +
      '• Como foi encerrado: Serviço executado.\n\n' +
      'Peço a abertura de um novo chamado considerando o histórico do protocolo anterior.',
  );
});

test('sem data, justificativa ou endereço a mensagem não inventa nada', () => {
  const text = formatReopenMessage({ protocol: '1', service: 'Poda', place: '', closedOn: null, closingNote: null });
  assert.match(text, /anterior foi encerrado, mas/);
  assert.match(text, /endereço a especificar/);
  assert.doesNotMatch(text, /Como foi encerrado/);
});
