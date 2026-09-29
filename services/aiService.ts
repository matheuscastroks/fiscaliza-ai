import * as FileSystem from 'expo-file-system/legacy';

import { analyzeLocally, type LocalAnalysisInput, type LocalAnalysisOutput } from '@/demo/localAnalysis';

export type AIAnalysisInput = LocalAnalysisInput;
export type AIAnalysisOutput = LocalAnalysisOutput;

/** Nome legado mantido para as telas atuais; análise apenas local e demonstrativa. */
export const analyzeWithAI = async (input: AIAnalysisInput): Promise<AIAnalysisOutput> => analyzeLocally(input);
export const analyzeWithRealAI = analyzeWithAI;
export const analyzeWithGemini = analyzeWithAI;

/** Conversão local, mantida por compatibilidade; não envia a imagem. */
export const imageToBase64 = async (imageUri: string): Promise<string> =>
  FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
