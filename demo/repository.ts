import { createScenarioFixtures, DEMO_SCENARIOS } from './fixtures.ts';
import type { CreateProblemInput, DemoProblem, DemoScenario, DemoStorage, ProblemFilters, UpdateProblemInput } from './types';

interface Snapshot { version: 1; scenario: DemoScenario; problems: DemoProblem[] }
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const validStatus = (value: unknown): value is DemoProblem['status'] => ['pending', 'in_progress', 'resolved'].includes(String(value));
const validCategory = (value: unknown) => ['road', 'lighting', 'cleaning', 'others'].includes(String(value));
const validPriority = (value: unknown) => ['low', 'medium', 'high'].includes(String(value));
const nonblank = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

function validProblem(value: unknown): value is DemoProblem {
  if (!value || typeof value !== 'object') return false;
  const p = value as DemoProblem;
  return nonblank(p.id) && nonblank(p.title) && nonblank(p.description) && validCategory(p.category)
    && validStatus(p.status) && validPriority(p.priority) && nonblank(p.reportedBy)
    && nonblank(p.reportedAt) && Number.isFinite(Date.parse(p.reportedAt))
    && !!p.location && Number.isFinite(p.location.latitude) && Number.isFinite(p.location.longitude)
    && nonblank(p.location.address) && Array.isArray(p.images) && p.images.every(image => typeof image === 'string')
    && Number.isInteger(p.votes) && p.votes >= 0 && Array.isArray(p.comments)
    && p.comments.every(comment => nonblank(comment.id) && nonblank(comment.text) && nonblank(comment.userId) && nonblank(comment.userName) && nonblank(comment.createdAt))
    && Array.isArray(p.statusHistory) && p.statusHistory.length > 0
    && p.statusHistory.every(change => validStatus(change.status) && nonblank(change.at) && Number.isFinite(Date.parse(change.at)) && nonblank(change.justification))
    && p.statusHistory.at(-1)?.status === p.status;
}

function validSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== 'object') return false;
  const s = value as Snapshot;
  return s.version === 1 && DEMO_SCENARIOS.includes(s.scenario) && Array.isArray(s.problems)
    && s.problems.every(validProblem) && new Set(s.problems.map(p => p.id)).size === s.problems.length;
}

function initial(scenario: DemoScenario = 'registered'): Snapshot {
  return { version: 1, scenario, problems: createScenarioFixtures(scenario) };
}

export function createDemoRepository(storage: DemoStorage, key: string) {
  if (!key.trim()) throw new Error('Chave de armazenamento obrigatória.');
  let snapshot: Snapshot | null = null;
  let warning: string | null = null;
  let loading: Promise<Snapshot> | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  async function restore(): Promise<Snapshot> {
    if (snapshot) return snapshot;
    if (!loading) {
      loading = (async () => {
        const raw = await storage.getItem(key);
        if (raw === null) return (snapshot = initial());
        try {
          const parsed: unknown = JSON.parse(raw);
          if (!validSnapshot(parsed)) throw new Error('shape');
          warning = null;
          return (snapshot = copy(parsed));
        } catch {
          warning = 'Dados locais inválidos. O cenário inicial foi restaurado em memória; confirme uma ação para gravá-lo.';
          return (snapshot = initial());
        }
      })().finally(() => { loading = null; });
    }
    return loading;
  }

  function mutate<T>(change: (draft: Snapshot) => T): Promise<T> {
    const result = queue.then(async () => {
      const current = await restore();
      const draft = copy(current);
      const value = change(draft);
      await storage.setItem(key, JSON.stringify(draft));
      snapshot = draft;
      warning = null;
      return value === undefined ? value : copy(value);
    });
    queue = result.catch(() => undefined);
    return result;
  }

  return {
    async list(filters?: ProblemFilters): Promise<DemoProblem[]> {
      const data = (await restore()).problems.filter(p =>
        (!filters?.status || filters.status === 'all' || p.status === filters.status)
        && (!filters?.category || filters.category === 'all' || p.category === filters.category)
        && (!filters?.priority || filters.priority === 'all' || p.priority === filters.priority)
        && (!filters?.userId || p.reportedBy === filters.userId)
        && (!filters?.search || `${p.title} ${p.description} ${p.location.address}`.toLocaleLowerCase('pt-BR').includes(filters.search.trim().toLocaleLowerCase('pt-BR')))
      ).sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
      return copy(data);
    },
    async get(id: string): Promise<DemoProblem | null> {
      const problem = (await restore()).problems.find(p => p.id === id);
      return problem ? copy(problem) : null;
    },
    create(input: CreateProblemInput): Promise<DemoProblem> {
      return mutate(draft => {
        if (!nonblank(input.title)) throw new Error('Informe um título.');
        if (!nonblank(input.description)) throw new Error('Informe uma descrição.');
        if (!validCategory(input.category) || !validPriority(input.priority) || !nonblank(input.reportedBy)
          || !input.location || !Number.isFinite(input.location.latitude) || !Number.isFinite(input.location.longitude)
          || !nonblank(input.location.address) || !Array.isArray(input.images) || !input.images.every(image => typeof image === 'string')) {
          throw new Error('Dados do relato inválidos.');
        }
        const at = new Date().toISOString();
        const problem: DemoProblem = {
          ...copy(input), id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          status: 'pending', reportedAt: at, votes: 1, comments: [],
          statusHistory: [{ status: 'pending', at, justification: 'Relato recebido para triagem.' }],
        };
        draft.problems.unshift(problem);
        return problem;
      });
    },
    update(id: string, updates: UpdateProblemInput): Promise<DemoProblem> {
      return mutate(draft => {
        const index = draft.problems.findIndex(p => p.id === id);
        if (index < 0) throw new Error('Relato não encontrado.');
        const previous = draft.problems[index];
        if (updates.status !== undefined && !validStatus(updates.status)) throw new Error('Status inválido.');
        if (updates.status && updates.status !== previous.status && !nonblank(updates.justification)) throw new Error('Informe uma justificativa para mudar o status.');
        const { justification, ...fields } = updates;
        const next: DemoProblem = { ...previous, ...copy(fields), id: previous.id, reportedAt: previous.reportedAt,
          reportedBy: previous.reportedBy, statusHistory: [...previous.statusHistory] };
        if (updates.status && updates.status !== previous.status) {
          const at = new Date().toISOString();
          next.statusHistory.push({ status: updates.status, at, justification: justification!.trim() });
          next.resolvedAt = updates.status === 'resolved' ? at : undefined;
        }
        if (!validProblem(next)) throw new Error('Dados do relato inválidos.');
        draft.problems[index] = next;
        return next;
      });
    },
    vote(id: string): Promise<number> {
      return mutate(draft => {
        const problem = draft.problems.find(p => p.id === id);
        if (!problem) throw new Error('Relato não encontrado.');
        return ++problem.votes;
      });
    },
    comment(id: string, userId: string, userName: string, text: string): Promise<DemoProblem> {
      return mutate(draft => {
        const problem = draft.problems.find(p => p.id === id);
        if (!problem) throw new Error('Relato não encontrado.');
        if (!nonblank(userId) || !nonblank(userName) || !nonblank(text)) throw new Error('Comentário inválido.');
        problem.comments.push({ id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          userId, userName, text: text.trim(), createdAt: new Date().toISOString() });
        return problem;
      });
    },
    reset(scenario: DemoScenario): Promise<void> {
      return mutate(draft => {
        if (!DEMO_SCENARIOS.includes(scenario)) throw new Error('Cenário inválido.');
        Object.assign(draft, initial(scenario));
      });
    },
    async getScenario(): Promise<DemoScenario> { return (await restore()).scenario; },
    getWarning(): string | null { return warning; },
  };
}

export type DemoRepository = ReturnType<typeof createDemoRepository>;
