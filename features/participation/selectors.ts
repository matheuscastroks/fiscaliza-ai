import { Problem, User } from '@/data/mockData';
import { calculateUserPoints, getUserCivicLevel } from './gamification';

export interface UserContributionSummary {
  totalReported: number;
  pendingCount: number;
  inProgressCount: number;
  resolvedCount: number;
  totalVotesReceived: number;
  points: number;
  levelInfo: {
    level: number;
    title: string;
    nextLevelPoints: number;
  };
}

export function getUserContributionSummary(
  user: User | null,
  problems: Problem[]
): UserContributionSummary {
  const userId = user?.id || 'demo-citizen';
  const userProblems = problems.filter((p) => p.reportedBy === userId);

  const pendingCount = userProblems.filter((p) => p.status === 'pending').length;
  const inProgressCount = userProblems.filter((p) => p.status === 'in_progress').length;
  const resolvedCount = userProblems.filter((p) => p.status === 'resolved').length;

  const totalVotesReceived = userProblems.reduce((acc, p) => acc + (p.votes || 0), 0);

  // Calcula total de comentários feitos pelo usuário em todos os problemas
  const commentsCount = problems.reduce((acc, p) => {
    return acc + (p.comments ? p.comments.filter((c) => c.userId === userId).length : 0);
  }, 0);

  const points = calculateUserPoints({
    reportsCount: userProblems.length,
    votesCount: totalVotesReceived,
    commentsCount,
  });

  const levelInfo = getUserCivicLevel(points);

  return {
    totalReported: userProblems.length,
    pendingCount,
    inProgressCount,
    resolvedCount,
    totalVotesReceived,
    points,
    levelInfo,
  };
}
