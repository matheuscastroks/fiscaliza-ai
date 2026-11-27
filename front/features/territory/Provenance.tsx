import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import type { SourceCoverage } from '@/shared/public-data';
import { dayLabel } from './evidence';
export function Provenance({ source }: { source: SourceCoverage }) {
  const unavailable =
    source.state === 'unavailable' || source.state === 'restricted';
  return (
    <View style={{ gap: 4 }}>
      <AppText variant="caption" color="muted">
        {unavailable
          ? 'Fonte indisponível'
          : source.state === 'stale'
            ? 'Última versão divulgada'
            : 'Divulgado'}
        {source.publishedAt
          ? ` · No app desde ${dayLabel(source.publishedAt)}`
          : ''}
      </AppText>
      <AppText variant="caption" color="muted">
        Data na fonte:{' '}
        {source.referenceDate
          ? dayLabel(source.referenceDate)
          : 'não informada'}
      </AppText>
      {source.unresolvedCount !== null &&
        source.unresolvedCount !== undefined &&
        source.unresolvedCount > 0 && (
          <AppText variant="caption" color="muted">
            {source.unresolvedCount} sem bairro confirmado.
          </AppText>
        )}
    </View>
  );
}
