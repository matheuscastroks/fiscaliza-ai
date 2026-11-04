/** Historical persisted JSON only; no active API or citizen workflow. */
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
