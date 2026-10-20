import React from 'react';
import { useNeighborhoods } from '@/features/territory/usePublicData';
import { useAuthStore } from '@/stores/authStore';
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
  const boundaries = useNeighborhoods();
  const home = useAuthStore((s) => s.user?.neighborhood);
  const canonical = boundaries.data?.map((x) => x.name) || options;
  options = [...canonical].sort((a, b) =>
    normalizeNeighborhood(a) === normalizeNeighborhood(home || '')
      ? -1
      : normalizeNeighborhood(b) === normalizeNeighborhood(home || '')
        ? 1
        : a.localeCompare(b, 'pt-BR'),
  );
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
        label: option || 'Todo o município',
      }))}
      value={currentValue}
      onChange={onChange}
    />
  );
}
