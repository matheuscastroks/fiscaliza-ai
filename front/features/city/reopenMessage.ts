/**
 * Texto para pedir de novo ao 1746 um serviço cujo chamado foi encerrado sem
 * resolver o problema. Cita o protocolo anterior e como a Prefeitura encerrou,
 * para quem atende ver o histórico. O app não abre o chamado: quem envia é o
 * morador, pelo WhatsApp oficial. Puro, para testar sem React Native.
 */
export function formatReopenMessage(input: {
  protocol: string;
  service: string;
  place: string;
  closedOn: string | null;
  /** Justificativa oficial ou, sem ela, a situação final informada. */
  closingNote: string | null;
}) {
  const closed = input.closedOn ? `encerrado em ${input.closedOn}` : 'encerrado';
  const lines = [
    'Olá! Quero pedir de novo um serviço pelo 1746. O chamado anterior foi ' +
      `${closed}, mas o problema continua no local.`,
    '',
    `• Protocolo anterior: ${input.protocol}`,
    `• Serviço: ${input.service.trim()}`,
    `• Onde: ${input.place.trim() || 'Rio de Janeiro (endereço a especificar)'}`,
  ];
  const note = input.closingNote?.trim();
  if (note) lines.push(`• Como foi encerrado: ${note}`);
  lines.push(
    '',
    'Peço a abertura de um novo chamado considerando o histórico do protocolo anterior.',
  );
  return lines.join('\n');
}
