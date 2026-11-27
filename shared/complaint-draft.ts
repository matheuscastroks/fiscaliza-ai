// Rascunho de mensagem para o 1746 sugerido a partir de uma foto. O app não
// registra a solicitação: quem envia é o morador, pelo WhatsApp oficial.

export const COMPLAINT_TOPIC_IDS = [
  'buraco',
  'iluminacao',
  'lixo',
  'bueiro',
  'arvore',
  'semaforo',
  'calcada',
  'vazamento',
  'outro',
] as const;

export type ComplaintTopicId = (typeof COMPLAINT_TOPIC_IDS)[number];

export const COMPLAINT_DESCRIPTION_MAX = 500;

export interface ComplaintDraft {
  /** false quando a foto não mostra um problema de zeladoria urbana. */
  isUrbanIssue: boolean;
  topicId: ComplaintTopicId;
  /** Texto sugerido; o morador revisa antes de enviar. Vazio quando isUrbanIssue é false. */
  description: string;
}

export const isComplaintTopicId = (value: unknown): value is ComplaintTopicId =>
  typeof value === 'string' &&
  (COMPLAINT_TOPIC_IDS as readonly string[]).includes(value);
