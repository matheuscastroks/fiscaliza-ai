import type { SyncCoverage } from './contracts.js';

export type FacilityCategory = 'school' | 'health' | 'square';
export type PublicationState =
  | 'available'
  | 'stale'
  | 'unavailable'
  | 'restricted';
export type TerritorialGeometry =
  | { type: 'Point'; coordinates: number[] }
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] };
export interface SourceCoverage {
  sourceId: string;
  state: PublicationState;
  coverage: SyncCoverage;
  referenceDate: string | null;
  publishedAt: string | null;
}
export interface PublicSource extends SourceCoverage {
  name: string;
  provider: string;
  officialUrl: string;
  attribution: string | null;
  usage: 'individual' | 'aggregate' | 'unknown';
  usageEvidenceUrl: string | null;
  sourceUpdatedAt: string | null;
}
export interface NeighborhoodSummary {
  id: string;
  municipalityId: string;
  name: string;
}
export interface NeighborhoodBoundary extends NeighborhoodSummary {
  geometry: Exclude<TerritorialGeometry, { type: 'Point' }>;
  provenance: PublicSource;
}
export interface PublicFacility {
  id: string;
  externalId: string;
  sourceId: string;
  category: FacilityCategory;
  name: string;
  address: string | null;
  phone: string | null;
  openingHours: string | null;
  activity: string | null;
  facilityType: string | null;
  neighborhoodId: string | null;
  neighborhoodName: string | null;
  location: { latitude: number; longitude: number } | null;
  locationDerived: boolean;
  geometry: TerritorialGeometry | null;
  provenance: PublicSource;
}
export interface FacilitiesQuery {
  categories?: FacilityCategory[];
  neighborhoodId?: string;
  search?: string;
  page?: number;
  limit?: number;
  north?: number;
  south?: number;
  east?: number;
  west?: number;
}
export interface FacilitiesPage {
  items: PublicFacility[];
  total: number | null;
  page: number;
  limit: number;
  hasMore: boolean;
  sources: SourceCoverage[];
}
export interface NeighborhoodOverview {
  neighborhood: NeighborhoodSummary;
  facilityCounts: Record<FacilityCategory, number | null>;
  sources: SourceCoverage[];
  calls: {
    total: number | null;
    topServices: { type: string; count: number }[];
    requestedStart: string;
    requestedEnd: string;
    availableStart: string | null;
    availableEnd: string | null;
    coverage: SyncCoverage;
  };
}
