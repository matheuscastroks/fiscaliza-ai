import type { Problem } from '../data/mockData';

export type DemoScenario = 'registered' | 'in_progress' | 'resolved';
export type DemoStatus = Problem['status'];

export interface StatusChange {
  status: DemoStatus;
  at: string;
  justification: string;
}

export type DemoProblem = Problem & { statusHistory: StatusChange[] };
export type CreateProblemInput = Omit<Problem, 'id' | 'reportedAt' | 'votes' | 'comments' | 'resolvedAt' | 'statusHistory'>;
export type UpdateProblemInput = Partial<Omit<Problem, 'id' | 'reportedAt' | 'reportedBy' | 'statusHistory'>> & { justification?: string };
export interface ProblemFilters {
  status?: string;
  category?: string;
  userId?: string;
  search?: string;
  priority?: string;
}
export interface DemoStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
