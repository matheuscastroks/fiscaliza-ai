import * as FileSystem from 'expo-file-system/legacy';

import { analyzeLocally, type LocalAnalysisInput, type LocalAnalysisOutput } from '@/demo/localAnalysis';

export type AIAnalysisInput = LocalAnalysisInput;
export type AIAnalysisOutput = LocalAnalysisOutput;

/** Conversão local de imagem para base64 para envio multimodal */
export const imageToBase64 = async (imageUri: string): Promise<string> => {
  try {
    return await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (error) {
    console.warn('Erro ao converter imagem para base64:', error);
    throw error;
  }
};

/** Função que processa e sanitiza a resposta JSON retornada pelo Gemini */
function sanitizeGeminiResult(rawText: string, input: AIAnalysisInput): AIAnalysisOutput {
  try {
    const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleaned);

    const validCategories: Array<'road' | 'lighting' | 'cleaning' | 'others'> = [
      'road',
      'lighting',
      'cleaning',
      'others',
    ];
    const category = validCategories.includes(data.suggestedCategory)
      ? data.suggestedCategory
      : 'others';

    const validPriorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
    const priority = validPriorities.includes(data.suggestedPriority)
      ? data.suggestedPriority
      : 'medium';

    const confidence = typeof data.confidence === 'number'
      ? Math.max(0, Math.min(1, data.confidence))
      : 0.85;

    return {
      suggestedTitle: (typeof data.suggestedTitle === 'string' && data.suggestedTitle.trim())
        ? data.suggestedTitle.trim().slice(0, 60)
        : 'Problema reportado',
      suggestedDescription: (typeof data.suggestedDescription === 'string' && data.suggestedDescription.trim())
        ? data.suggestedDescription.trim()
        : input.description,
      suggestedCategory: category,
      suggestedPriority: priority,
      confidence,
      imageAnalysis: typeof data.imageAnalysis === 'string' ? data.imageAnalysis : undefined,
      analysisSource: 'simulação local',
    };
  } catch (parseError) {
    console.warn('Falha ao interpretar JSON do Gemini, utilizando fallback local:', parseError);
    return analyzeLocally(input);
  }
}

/** Chamada à API oficial do Google Gemini com fallback automático para heurística local */
export async function analyzeWithGemini(input: AIAnalysisInput): Promise<AIAnalysisOutput> {
  const apiKey =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    '';

  if (!apiKey) {
    console.log('Chave do Gemini não encontrada no ambiente; usando análise local.');
    return analyzeLocally(input);
  }

  try {
    const parts: any[] = [];

    // Se houver imagem, anexa inlineData em base64
    if (input.imageUri) {
      try {
        const base64Data = await imageToBase64(input.imageUri);
        const isPng = input.imageUri.toLowerCase().endsWith('.png');
        parts.push({
          inlineData: {
            mimeType: isPng ? 'image/png' : 'image/jpeg',
            data: base64Data,
          },
        });
      } catch (e) {
        console.warn('Não foi possível anexar imagem à requisição do Gemini:', e);
      }
    }

    const promptText = `Você é um assistente de inteligência artificial do aplicativo Fiscaliza AI, responsável por analisar problemas urbanos reportados por cidadãos (ex: buracos, lâmpadas apagadas, lixo, esgoto).

Relato do cidadão: "${input.description}"
${input.location ? `Coordenadas: Lat ${input.location.latitude}, Lng ${input.location.longitude}` : ''}

Retorne ESTRITAMENTE um objeto JSON com as chaves:
- "suggestedTitle": Título claro, formal e conciso (máximo 60 caracteres).
- "suggestedDescription": Descrição detalhada do problema baseada no relato e na foto (se houver).
- "suggestedCategory": exatamente uma destas 4: "road" (vias, calçadas, buracos), "lighting" (iluminação pública, postes), "cleaning" (lixo, mato, entulho), "others" (outros).
- "suggestedPriority": exatamente uma destas 3: "low", "medium", "high" (use high em caso de perigo evidente ou obstrução crítica).
- "confidence": número decimal entre 0.0 e 1.0.
- "imageAnalysis": resumo objetivo do que é visualizado na imagem (ou "Imagem não fornecida").`;

    parts.push({ text: promptText });

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          const candidateText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            return sanitizeGeminiResult(candidateText, input);
          }
        } else {
          lastError = await response.text();
        }
      } catch (err) {
        lastError = err;
      }
    }

    console.warn('Não foi possível obter resposta do Gemini em nenhum modelo testado:', lastError);
    return analyzeLocally(input);
  } catch (error) {
    console.warn('Erro na análise com Gemini, acionando análise local:', error);
    return analyzeLocally(input);
  }
}

/** Análise de IA local (heurística rápida offline) */
export const analyzeWithAI = async (input: AIAnalysisInput): Promise<AIAnalysisOutput> =>
  analyzeLocally(input);

/** Função principal chamada pelas telas de denúncia */
export const analyzeWithRealAI = async (input: AIAnalysisInput): Promise<AIAnalysisOutput> => {
  return analyzeWithGemini(input);
};
