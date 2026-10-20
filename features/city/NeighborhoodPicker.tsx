import React from 'react';
import { AppSelect } from '@/components/ui/AppSelect';
import { normalizeNeighborhood } from '@/shared/civic-territory';

export function NeighborhoodPicker({
  options,
  value,
  onChange,
  compact = false,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const labels =
    value &&
    !options.some(
      (option) =>
        normalizeNeighborhood(option) === normalizeNeighborhood(value),
    )
      ? [value, ...options]
      : options;

  const currentValue =
    labels.find(
      (option) =>
        normalizeNeighborhood(option) === normalizeNeighborhood(value),
    ) || '';

  return (
    <AppSelect
      label="Filtrar por bairro"
      placeholder="Buscar bairro do Rio de Janeiro..."
      icon="location-outline"
      compact={compact}
      defaultValue=""
      options={['', ...labels].map((option) => ({
        value: option,
        label: option || (compact ? 'Todos os bairros' : 'Todo o Rio de Janeiro'),
      }))}
      value={currentValue}
      onChange={onChange}
    />
  );
}
