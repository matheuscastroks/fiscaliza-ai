/**
 * Fiscaliza-AI — Regras de Participação Cívica (Gamificação Sóbria)
 * Critérios transparentes para o ambiente demonstrativo.
 */

export const CIVIC_POINTS = {
  REPORT_CREATED: 10,
  COMMUNITY_VOTE: 1,
  COMMENT_ADDED: 2,
} as const;

export function calculateUserPoints(stats: {
  reportsCount: number;
  votesCount: number;
  commentsCount: number;
}): number {
  return (
    stats.reportsCount * CIVIC_POINTS.REPORT_CREATED +
    stats.votesCount * CIVIC_POINTS.COMMUNITY_VOTE +
    stats.commentsCount * CIVIC_POINTS.COMMENT_ADDED
  );
}

export function getUserCivicLevel(points: number): {
  level: number;
  title: string;
  nextLevelPoints: number;
} {
  if (points >= 100) {
    return { level: 3, title: 'Cidadão Ativo', nextLevelPoints: 250 };
  }
  if (points >= 30) {
    return { level: 2, title: 'Colaborador Local', nextLevelPoints: 100 };
  }
  return { level: 1, title: 'Participante', nextLevelPoints: 30 };
}
