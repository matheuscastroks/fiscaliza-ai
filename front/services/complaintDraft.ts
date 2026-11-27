import type { ComplaintDraft } from '@/shared/complaint-draft';
import { uploadFile } from './http';

/**
 * Pede à API uma sugestão de texto a partir da foto. Exige conta com
 * município; a foto é analisada e descartada no servidor.
 */
export function analyzeComplaintPhoto(uri: string) {
  return uploadFile<ComplaintDraft>(uri, '/v1/complaint-drafts/analyze', 30000);
}
