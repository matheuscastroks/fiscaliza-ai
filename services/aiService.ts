import {
  analyzeLocally,
  type LocalAnalysisInput,
  type LocalAnalysisOutput,
} from '@/demo/localAnalysis';
/** Compatibility exports. No secret, base64 conversion or Google request runs in the app. */
export async function analyzeWithAI(
  input: LocalAnalysisInput,
): Promise<LocalAnalysisOutput> {
  return analyzeLocally(input);
}
export const analyzeWithRealAI = analyzeWithAI;
export const analyzeWithGemini = analyzeWithAI;
export async function imageToBase64(_uri: string): Promise<string> {
  throw new Error('A análise de fotos não está disponível.');
}
