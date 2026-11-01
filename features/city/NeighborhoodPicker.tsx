import React, { useMemo } from 'react';
import { useNeighborhoods } from '@/features/territory/usePublicData';
import { useTerritoryStore } from '@/stores/territoryStore';
import { AppSelect } from '@/components/ui/AppSelect';
import { normalizeNeighborhood } from '@/shared/civic-territory';

export function NeighborhoodPicker({
  options: fallbackOptions,
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
  const home = useTerritoryStore((s) => s.preferredNeighborhood);
  const boundaryNames = boundaries.data;

  const { currentValue, selectOptions } = useMemo(() => {
    const canonical = boundaryNames?.map((x) => x.name) || fallbackOptions;
    const normalizedHome = normalizeNeighborhood(home || '');

    // Pre-calculate normalized names to avoid thousands of repetitive regex operations during sort
    const normMap = new Map<string, string>();
    const getNorm = (name: string) => {
      let n = normMap.get(name);
      if (n === undefined) {
        n = normalizeNeighborhood(name);
        normMap.set(name, n);
      }
      return n;
    };

    const sorted = [...canonical].sort((a, b) => {
      const normA = getNorm(a);
      const normB = getNorm(b);
      if (normA === normalizedHome) return -1;
      if (normB === normalizedHome) return 1;
      return a.localeCompare(b, 'pt-BR');
    });

    const normValue = normalizeNeighborhood(value || '');
    const hasValue = value && sorted.some((opt) => getNorm(opt) === normValue);
    const resolvedLabels = value && !hasValue ? [value, ...sorted] : sorted;

    const matched =
      resolvedLabels.find((opt) => getNorm(opt) === normValue) || '';

    const selectOpts = ['', ...resolvedLabels].map((option) => ({
      value: option,
      label: option || 'Todo o município',
    }));

    return {
      currentValue: matched,
      selectOptions: selectOpts,
    };
  }, [boundaryNames, fallbackOptions, home, value]);

  return (
    <AppSelect
      label="Filtrar por bairro"
      placeholder="Buscar bairro do Rio de Janeiro..."
      icon="location-outline"
      compact={compact}
      defaultValue=""
      options={selectOptions}
      value={currentValue}
      onChange={onChange}
    />
  );
}
