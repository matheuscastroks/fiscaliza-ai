import { request } from './http';
import type {
  OfficialCall,
  OfficialCallsFilterOptions,
  OfficialCallsListResponse,
  OfficialCallsOverview,
  OfficialCallsQueryParams,
} from '@/shared/contracts';

export async function fetchOfficialCalls(
  params: OfficialCallsQueryParams = {},
): Promise<OfficialCallsListResponse> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.bairro) query.set('bairro', params.bairro);
  if (params.tipo) query.set('tipo', params.tipo);
  if (params.subtipo) query.set('subtipo', params.subtipo);
  if (params.situacao) query.set('situacao', params.situacao);
  if (params.hasCoordinates !== undefined) {
    query.set('hasCoordinates', String(params.hasCoordinates));
  }
  if (params.search) query.set('search', params.search);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.north !== undefined) query.set('north', String(params.north));
  if (params.south !== undefined) query.set('south', String(params.south));
  if (params.east !== undefined) query.set('east', String(params.east));
  if (params.west !== undefined) query.set('west', String(params.west));

  const qs = query.toString();
  return request<OfficialCallsListResponse>(`/rio1746/calls${qs ? `?${qs}` : ''}`);
}

export async function fetchOfficialCall(id: string): Promise<OfficialCall> {
  return request<OfficialCall>(`/rio1746/calls/${encodeURIComponent(id)}`);
}

export async function fetchOfficialFilters(): Promise<OfficialCallsFilterOptions> {
  return request<OfficialCallsFilterOptions>('/rio1746/filters');
}

export async function fetchOfficialOverview(bairro?: string): Promise<OfficialCallsOverview> {
  const qs = bairro ? `?bairro=${encodeURIComponent(bairro)}` : '';
  return request<OfficialCallsOverview>(`/rio1746/overview${qs}`);
}

export interface SyncStatusResult {
  id: string;
  lastPartitionDate: string | null;
  lastSyncAt: string | null;
  recordsSynced: number | null;
  status: string;
  errorMessage: string | null;
}

export async function fetchSyncStatus(): Promise<SyncStatusResult | null> {
  return request<SyncStatusResult | null>('/rio1746/sync-status');
}
