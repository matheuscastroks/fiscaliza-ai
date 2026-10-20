/** Public HTTP contracts. Passwords, session secrets and database rows never belong here. */
export * from './public-data.js';
export type Role = 'citizen' | 'staff' | 'admin';
export type SyncCoverage = 'complete' | 'partial' | 'unknown';
export interface SyncRunSummary {
  id: string;
  sourceId: string;
  status: 'running' | 'success' | 'partial' | 'failed';
  coverage: SyncCoverage;
  requestedStart: string | null;
  requestedEnd: string | null;
  startedAt: string;
  finishedAt: string | null;
  counters: {
    received: number;
    imported: number;
    updated: number;
    rejected: number;
  };
}
export interface Municipality {
  /** Official seven-digit IBGE municipality code. */
  id: string;
  name: string;
  state: string;
  center: { latitude: number; longitude: number };
  bounds: { north: number; south: number; east: number; west: number };
}
export interface PostalCodeLookup {
  postalCode: string;
  municipality: Municipality;
  neighborhood: string;
  street: string;
}
export interface SessionUser {
  avatar?: string;
  id: string;
  name: string;
  email: string;
  role: Role;
  sector?: string;
  municipality?: Municipality | null;
  postalCode?: string;
  neighborhood?: string;
}
export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
export type Status = 'pending' | 'in_progress' | 'resolved';
export interface CityEvent {
  source?: 'citizen' | 'management';
  id?: string;
  status: Status;
  at: string;
  justification: string;
  actor?: string;
  sector?: string;
}
export interface CityComment {
  editedAt?: string;
  avatar?: string;
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: string;
}
export interface Occurrence {
  municipalInterventionAt?: string;
  canDelete?: boolean;
  /** Distinct authenticated accounts that opened this record. */
  views?: number;
  id: string;
  municipalityId?: string;
  title: string;
  description: string;
  category: 'road' | 'lighting' | 'cleaning' | 'others';
  status: Status;
  priority: 'low' | 'medium' | 'high';
  reportedImpact?: 'low' | 'medium' | 'high';
  location: {
    latitude: number;
    longitude: number;
    address: string;
    neighborhood?: string;
  };
  images: string[];
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  votes: number;
  comments: CityComment[];
  statusHistory: CityEvent[];
  supportedByMe?: boolean;
  followedByMe?: boolean;
  sector?: string;
  relatedIds?: string[];
  evaluation?: {
    satisfied: boolean;
    reason: string;
    rating?: number;
    at: string;
  };
}
export type CivicTerritory =
  | { scope: 'municipality' }
  | { scope: 'neighborhood'; neighborhood: string }
  | {
      scope: 'location';
      neighborhood: string;
      location: { latitude: number; longitude: number; address?: string };
    };
export interface CivicBase {
  municipalInterventionAt?: string;
  canDelete?: boolean;
  id: string;
  municipalityId?: string;
  title: string;
  summary: string;
  body: string;
  neighborhood: string;
  territory?: CivicTerritory;
  createdBy: string;
  createdAt: string;
  responsible: string;
  comments: CityComment[];
  views?: number;
  supports: number;
  supportedByMe?: boolean;
  followedByMe?: boolean;
  linkedIds: string[];
  history?: {
    at: string;
    actor: string;
    from: string;
    to: string;
    text: string;
  }[];
}
export interface Proposal extends CivicBase {
  kind: 'proposal';
  images?: string[];
  status: 'submitted' | 'under_review' | 'accepted' | 'declined';
  decision?: string;
}
export interface Consultation extends CivicBase {
  kind: 'consultation';
  status: 'open' | 'closed';
  closesAt: string;
  options: string[];
  myAnswer?: number;
  answerCounts: number[];
  result?: string;
}
export interface PublicAction extends CivicBase {
  kind: 'action';
  status: 'planned' | 'in_progress' | 'completed';
  progress: number;
  dueAt: string;
  evidence: string[];
  updates: { at: string; text: string; actor: string }[];
}
export type CivicItem = Proposal | Consultation | PublicAction;
export interface CityOverview {
  municipalScope?: {
    proposals: number;
    consultations: number;
    actions: number;
  };
  occurrences: number;
  resolved: number;
  proposals: number;
  consultations: number;
  actions: number;
  neighborhoods: {
    name: string;
    proposals?: number;
    consultations?: number;
    occurrences: number;
    resolved: number;
    actions: number;
  }[];
}
export interface Analysis {
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedCategory: Occurrence['category'];
  suggestedPriority: Occurrence['priority'];
  confidence: number;
  analysisSource: 'gemini' | 'heuristic';
  imageAnalysis?: string;
  imageAnalyzed?: boolean;
}

export interface OfficialCall {
  id: string;
  externalId: string;
  source: 'rio1746';
  municipalityId: string;
  serviceCategory?: string | null;
  serviceType: string;
  serviceSubtype: string;
  organizationName?: string | null;
  officialStatus?: string | null;
  officialSituation?: string | null;
  officialSituationType?: string | null;
  statusJustification?: string | null;
  openedAt: string;
  closedAt?: string | null;
  targetDate?: string | null;
  withinDeadline?: string | null;
  timeRemaining?: number | null;
  timeUnit?: string | null;
  neighborhoodId?: string | null;
  neighborhoodName?: string | null;
  subprefecture?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  sourcePartitionDate?: string | null;
  importedAt: string;
  updatedAt: string;
}

export interface OfficialCallsFilterOptions {
  bairros: string[];
  tipos: string[];
  subtipos: string[];
  situacoes: string[];
}

export interface OfficialCallsQueryParams {
  neighborhoodId?: string;
  page?: number;
  limit?: number;
  bairro?: string;
  tipo?: string;
  subtipo?: string;
  situacao?: string;
  hasCoordinates?: boolean;
  search?: string;
  periodDays?: number;
  startDate?: string;
  endDate?: string;
  north?: number;
  south?: number;
  east?: number;
  west?: number;
}

export interface OfficialCallsListResponse {
  territoryConfirmed?: boolean;
  calls: OfficialCall[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface OfficialCallsOverview {
  territoryConfirmed?: boolean;
  totalCalls: number;
  openCalls: number;
  closedCalls: number;
  callsWithCoordinates: number;
  withinDeadlineCount?: number;
  overdueCount?: number;
  withinDeadlineRate?: number;
  topServices: { type: string; count: number }[];
  topNeighborhoods: { neighborhood: string; count: number }[];
  situationBreakdown: { situation: string; count: number }[];
  statusBreakdown?: { status: string; count: number }[];
  minOpenedAt?: string | null;
  maxOpenedAt?: string | null;
  lastPartitionDate: string | null;
  lastSyncedAt: string | null;
}
