export interface LocalAnalysisInput {
  description: string;
  imageUri?: string;
  location?: { latitude: number; longitude: number };
}

export interface LocalAnalysisOutput {
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedCategory: 'road' | 'lighting' | 'cleaning' | 'others';
  suggestedPriority: 'low' | 'medium' | 'high';
  confidence: number;
  imageAnalysis?: string;
  analysisSource: 'simulação local';
}

/** Sugestões por palavras-chave para a demonstração. Nenhuma imagem é inspecionada. */
export function analyzeLocally(input: LocalAnalysisInput): LocalAnalysisOutput {
  const description = input.description.trim();
  const lower = description.toLocaleLowerCase('pt-BR');
  const category = /poste|l[aâ]mpada|ilumina|apagado|apagada|escuro/.test(lower) ? 'lighting'
    : /buraco|asfalto|pavimento|cal[cç]ada|estrada|via/.test(lower) ? 'road'
    : /lixo|entulho|mato|limpeza|sujeira/.test(lower) ? 'cleaning' : 'others';
  const priority = /perigo|risco|urgente|acidente|bloque|emerg[eê]ncia/.test(lower) ? 'high'
    : /aten[cç][aã]o|atrapalha|incomoda|problema/.test(lower) ? 'medium' : 'low';
  const titles = { road: 'Problema na via', lighting: 'Problema de iluminação',
    cleaning: 'Problema de limpeza', others: 'Ocorrência urbana' };
  return {
    suggestedTitle: titles[category], suggestedDescription: description,
    suggestedCategory: category, suggestedPriority: priority,
    confidence: category === 'others' ? 0.4 : 0.7,
    imageAnalysis: input.imageUri ? 'Imagem anexada, não analisada nesta simulação.' : undefined,
    analysisSource: 'simulação local',
  };
}
