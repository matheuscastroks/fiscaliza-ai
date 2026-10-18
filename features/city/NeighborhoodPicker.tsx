import React from 'react';
import { SlidingTabs } from '@/components/ui/SlidingTabs';
import { normalizeNeighborhood } from '@/shared/civic-territory';

export function NeighborhoodPicker({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const labels =
    value &&
    !options.some(
      (option) =>
        normalizeNeighborhood(option) === normalizeNeighborhood(value),
    )
      ? [value, ...options]
      : options;
  return (
    <SlidingTabs
      label="Filtrar por bairro"
      options={['', ...labels].map((option) => ({
        value: option,
        label: option || 'Todo o município',
      }))}
      value={
        labels.find(
          (option) =>
            normalizeNeighborhood(option) === normalizeNeighborhood(value),
        ) || ''
      }
      onChange={onChange}
    />
  );
}
