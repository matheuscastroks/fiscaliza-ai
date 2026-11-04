/** Public HTTP contracts. Passwords, session secrets and database rows never belong here. */
export * from './public-data.js';
export type Role = 'citizen';
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
  cursor?: string;
  includeTotal?: boolean;
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
  nextCursor?: string | null;
  territoryConfirmed?: boolean;
  calls: OfficialCall[];
  total: number | null;
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
