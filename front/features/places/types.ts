export type RadiusMeters = 500 | 1000 | 2000 | 5000;
export type Neighborhood = { id: string; name: string };
export type Point = { latitude: number; longitude: number };
export type CapturedDeviceLocation = Point & { accuracyMeters: number | null; capturedAt: number };
export type TerritorySelection =
  | { kind: 'municipality' }
  | { kind: 'pending-current'; radiusMeters: RadiusMeters }
  | { kind: 'neighborhood'; id?: string; name: string }
  | ({ kind: 'radius'; source: 'current' | 'place'; placeId?: string; radiusMeters: RadiusMeters; neighborhood: Neighborhood | null; accuracyMeters?: number | null; capturedAt?: number } & Point);
export type SavedPlace = Point & { id: string; name: string; addressLabel: string; radiusMeters: RadiusMeters; neighborhood: Neighborhood | null };
