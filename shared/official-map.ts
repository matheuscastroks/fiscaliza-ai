import type { OfficialCallsQueryParams } from './contracts.js';

export type MapViewport = { north: number; south: number; east: number; west: number };
export type OfficialMapCell = {
  key: string;
  /** Only singleton cells expose a call id; aggregate cells are opened by zooming. */
  id: string | null;
  count: number;
  latitude: number;
  longitude: number;
  north: number;
  south: number;
  east: number;
  west: number;
};
export type OfficialMapSnapshot = {
  /** All matching records, independent of the camera and list pagination. */
  total: number;
  locatedTotal: number;
  unlocatedTotal: number;
  /** Matching records inside this viewport; equals the sum of cell counts. */
  visibleTotal: number;
  cells: OfficialMapCell[];
};
export type OfficialCallMapQueryParams = Omit<OfficialCallsQueryParams,
  'page' | 'limit' | 'cursor' | 'includeTotal' | 'hasCoordinates'> & {
  viewNorth: number;
  viewSouth: number;
  viewEast: number;
  viewWest: number;
};
