import type {
  CivicItem,
  Consultation,
  Occurrence,
  PublicAction,
} from './contracts.ts';

export type CityHighlight =
  | { kind: 'evaluation'; occurrence: Occurrence; at: number }
  | {
      kind: 'response';
      occurrence: Occurrence;
      text: string;
      institutional: boolean;
      at: number;
    }
  | { kind: 'consultation'; item: Consultation; at: number }
  | { kind: 'result'; item: PublicAction; at: number };

export function consultationIsOpen(
  item: CivicItem,
  now: number,
): item is Consultation {
  return (
    item.kind === 'consultation' &&
    item.status === 'open' &&
    new Date(item.closesAt).getTime() > now
  );
}

export function isHomeOccurrence(item: Occurrence, userId: string) {
  return !(
    item.reportedBy === userId &&
    item.status === 'resolved' &&
    (item.evaluation?.rating || item.evaluation?.satisfied)
  );
}

export function cityHighlights(
  occurrences: Occurrence[],
  items: CivicItem[],
  userId: string,
  now: number,
): CityHighlight[] {
  const day = 24 * 60 * 60 * 1000;
  const evaluations: CityHighlight[] = occurrences
    .filter(
      (item) =>
        item.reportedBy === userId &&
        item.status === 'resolved' &&
        !item.evaluation,
    )
    .map<CityHighlight>((occurrence) => ({
      kind: 'evaluation',
      occurrence,
      at: new Date(occurrence.resolvedAt || occurrence.reportedAt).getTime(),
    }))
    .sort((a, b) => b.at - a.at);
  const consultations: CityHighlight[] = items
    .filter(
      (item): item is Consultation =>
        consultationIsOpen(item, now) &&
        new Date(item.closesAt).getTime() - now <= 3 * day &&
        item.myAnswer === undefined,
    )
    .map<CityHighlight>((item) => ({
      kind: 'consultation',
      item,
      at: new Date(item.closesAt).getTime(),
    }))
    .sort((a, b) => a.at - b.at);
  const results: CityHighlight[] = items
    .filter(
      (item): item is PublicAction =>
        item.kind === 'action' && item.status === 'completed',
    )
    .map<CityHighlight>((item) => ({
      kind: 'result',
      item,
      at: Math.max(
        new Date(item.createdAt).getTime(),
        ...item.updates
          .map((u) => new Date(u.at).getTime())
          .filter(Number.isFinite),
      ),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.at) && item.at <= now && now - item.at <= 30 * day,
    )
    .sort((a, b) => b.at - a.at);
  const responses: CityHighlight[] = occurrences
    .filter((item) => isHomeOccurrence(item, userId))
    .flatMap((occurrence) => {
      const latest = occurrence.statusHistory
        .filter(
          (event) =>
            event.status !== 'pending' &&
            event.source !== 'citizen' &&
            event.justification.trim() &&
            Number.isFinite(new Date(event.at).getTime()) &&
            new Date(event.at).getTime() <= now,
        )
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())[0];
      return latest
        ? [
            {
              kind: 'response' as const,
              occurrence,
              text: latest.justification,
              institutional: latest.source === 'management',
              at: new Date(latest.at).getTime(),
            },
          ]
        : [];
    })
    .sort((a, b) => b.at - a.at);
  const seen = new Set<string>();
  return [...evaluations, ...consultations, ...results, ...responses]
    .filter((item) => {
      const id = 'occurrence' in item ? item.occurrence.id : item.item.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .slice(0, 3);
}
