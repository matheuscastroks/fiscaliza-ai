/** Texto que o morador envia ao 1746. Puro, para testar sem React Native. */
export function formatComplaintMessage(input: {
  topicLabel: string;
  address: string;
  description: string;
  hasPhoto: boolean;
}) {
  const loc = input.address.trim() || 'Rio de Janeiro (endereço a especificar)';
  const desc = input.description.trim() || 'Solicitação de reparo / vistoria';
  return (
    `Olá! Quero pedir um serviço pelo 1746:\n\n` +
    `• Assunto: ${input.topicLabel}\n` +
    `• Onde: ${loc}\n` +
    `• Detalhes: ${desc}` +
    (input.hasPhoto ? `\n• Foto do local em anexo` : '')
  );
}

export type ComplaintStep = 'photo' | 'details' | 'confirm';

export const COMPLAINT_STEPS: ComplaintStep[] = ['photo', 'details', 'confirm'];

export const COMPLAINT_STEP_TITLES: Record<ComplaintStep, string> = {
  photo: 'Foto do problema',
  details: 'Revise o pedido',
  confirm: 'Confirme e envie',
};
