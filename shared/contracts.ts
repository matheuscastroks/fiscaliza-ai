/** Public HTTP contracts. Passwords, session secrets and database rows never belong here. */
export type Role = 'citizen' | 'staff' | 'admin';
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
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: string;
}
export interface Occurrence {
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
  evaluation?: { satisfied: boolean; reason: string; at: string };
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
}
