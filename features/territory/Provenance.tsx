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
          ? 'Fonte sem publicação disponível'
          : source.state === 'stale'
            ? 'Última publicação disponível'
            : 'Cadastro publicado'}
        {source.publishedAt
          ? ` · Importação: ${dayLabel(source.publishedAt)}`
          : ''}
      </AppText>
      <AppText variant="caption" color="muted">
        Referência na origem:{' '}
        {source.referenceDate
          ? dayLabel(source.referenceDate)
          : 'não informada'}
      </AppText>
      {source.unresolvedCount !== null &&
        source.unresolvedCount !== undefined &&
        source.unresolvedCount > 0 && (
          <AppText variant="caption" color="muted">
            {source.unresolvedCount} cadastros da fonte sem bairro confirmado no
            município.
          </AppText>
        )}
    </View>
  );
}
