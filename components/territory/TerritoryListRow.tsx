import React, { memo } from 'react';
import { OfficialCallRow } from '@/components/official/OfficialCallRow';
import { FacilityRow } from '@/components/territory/FacilityRow';
import type { Entry } from './TerritoryPreviewCard';

interface Props {
  entry: Entry;
  onOpen: (entry: Entry) => void;
}

/** Entries can be rebuilt when another layer loads; compare the underlying model. */
export const TerritoryListRow = memo(
  function TerritoryListRow({ entry, onOpen }: Props) {
    if (entry.type === 'facility') {
      return <FacilityRow item={entry.item} onPress={() => onOpen(entry)} />;
    }
    if (entry.type === 'official') {
      return (
        <OfficialCallRow call={entry.item} onPress={() => onOpen(entry)} />
      );
    }
    return null;
  },
  (previous, next) =>
    previous.entry.type === next.entry.type &&
    previous.entry.item === next.entry.item &&
    previous.onOpen === next.onOpen,
);
