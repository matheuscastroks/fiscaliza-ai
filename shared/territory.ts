export interface Point {
  latitude: number;
  longitude: number;
}
export interface MapRegion extends Point {
  latitudeDelta: number;
  longitudeDelta: number;
}
export function distanceMeters(a: Point, b: Point): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function inMapRegion(point: Point, region: MapRegion): boolean {
  return (
    Math.abs(point.latitude - region.latitude) <= region.latitudeDelta / 2 &&
    Math.abs(point.longitude - region.longitude) <= region.longitudeDelta / 2
  );
}
