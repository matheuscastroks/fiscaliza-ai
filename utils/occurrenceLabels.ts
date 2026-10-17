import { Problem } from '@/data/mockData';

export const STATUS_LABELS: Record<Problem['status'], string> = {
  pending: 'Recebida',
  in_progress: 'Em atendimento',
  resolved: 'Concluída',
};

export const CATEGORY_LABELS: Record<Problem['category'], string> = {
  road: 'Pavimentação e via',
  lighting: 'Iluminação pública',
  cleaning: 'Limpeza urbana',
  others: 'Outros serviços',
};

export const PRIORITY_LABELS: Record<Problem['priority'], string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export function getStatusLabel(status: Problem['status'] | string): string {
  return STATUS_LABELS[status as Problem['status']] || status;
}

export function getCategoryLabel(category: Problem['category'] | string): string {
  return CATEGORY_LABELS[category as Problem['category']] || category;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).replace('.', '');
  } catch {
    return dateString;
  }
}
