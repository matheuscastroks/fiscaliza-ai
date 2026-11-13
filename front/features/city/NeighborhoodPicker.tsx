import React, { useMemo } from 'react';
import { useNeighborhoods } from '@/features/territory/usePublicData';
import { useTerritoryStore } from '@/stores/territoryStore';
import { AppSelect } from '@/components/ui/AppSelect';
import { normalizeNeighborhood } from '@/shared/neighborhood';
import { useOfficialFilters } from '@/features/city/useOfficialCalls';

// Reuse ICU's Portuguese collation rules instead of constructing them per comparison.
const neighborhoodCollator = new Intl.Collator('pt-BR');

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
  const boundaryLabels = useMemo(() => boundaryNames?.map(x => x.name), [boundaryNames]);
  // Nem todo bairro tem limite cadastrado; os nomes dos filtros do 1746 completam a lista.
  const officialNames = useOfficialFilters().data?.bairros;
  const canonical = useMemo(() => {
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const name of [...(boundaryLabels ?? []), ...(officialNames ?? []), ...fallbackOptions]) {
      const key = normalizeNeighborhood(name);
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(name);
      }
    }
    return merged;
  }, [boundaryLabels, officialNames, fallbackOptions]);

  const { currentValue, selectOptions } = useMemo(() => {
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
      return neighborhoodCollator.compare(a, b);
    });

    const normValue = normalizeNeighborhood(value || '');
    const hasValue = value && sorted.some((opt) => getNorm(opt) === normValue);
    const resolvedLabels = value && !hasValue ? [value, ...sorted] : sorted;

    const matched =
      resolvedLabels.find((opt) => getNorm(opt) === normValue) || '';

    const selectOpts = ['', ...resolvedLabels].map((option) => ({
      value: option,
      label: option || 'A cidade toda',
    }));

    return {
      currentValue: matched,
      selectOptions: selectOpts,
    };
  }, [canonical, home, value]);

  return (
    <AppSelect
      label="Filtrar por bairro"
      placeholder="Buscar bairro do Rio de Janeiro…"
      icon="location-outline"
      compact={compact}
      defaultValue=""
      options={selectOptions}
      value={currentValue}
      onChange={onChange}
    />
  );
}
