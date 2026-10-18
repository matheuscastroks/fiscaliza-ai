import type { Occurrence } from './contracts.ts';
import { distanceMeters } from './territory.ts';

/** Nearby means <= 1.5 km in the same municipality, never just a matching title. */
export function nearbyOccurrences(
  current: Occurrence,
  candidates: Occurrence[],
) {
  return candidates
    .filter(
      (item) =>
        item.id !== current.id &&
        item.municipalityId === current.municipalityId,
    )
    .map((item) => ({
      item,
      distance: distanceMeters(current.location, item.location),
    }))
    .filter(({ distance }) => Number.isFinite(distance) && distance <= 1500)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4);
}
