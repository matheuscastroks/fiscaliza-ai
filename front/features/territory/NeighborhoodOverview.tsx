import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { InsetGroup, ListRow } from '@/components/ui/ListRow';
import { spacing } from '@/theme/spacing';
import type { NeighborhoodOverview as Overview } from '@/shared/public-data';
import { facilityLabels } from './selectors';
import {
  countLabel,
  coverageLabel,
  evidenceScope,
  periodLabel,
  dayLabel,
} from './evidence';
import { Provenance } from './Provenance';
const serviceCategories = [
  { category: 'school', sourceId: 'siurb-schools' },
  { category: 'health', sourceId: 'siurb-health' },
  { category: 'square', sourceId: 'siurb-squares' },
] as const;
export function NeighborhoodOverview({
  data,
  updatingPeriod,
  onDates,
}: {
  data: Overview;
  updatingPeriod: boolean;
  onDates: (dates: { startDate: string; endDate: string }) => void;
}) {
  const [showSources, setShowSources] = useState(false);
  const [startDate, setStart] = useState(data.calls.requestedStart);
  const [endDate, setEnd] = useState(data.calls.requestedEnd);
  const [dateError, setDateError] = useState('');
  const dates = {
    startDate: data.calls.requestedStart,
    endDate: data.calls.requestedEnd,
  };
  const open = (layer: 'official' | 'school' | 'health' | 'square') =>
    router.push({
      pathname: '/(tabs)/TerritoryScreen',
      params: {
        ...evidenceScope(data.neighborhood.id, layer, dates),
        scopeRequest: String(Date.now()),
      },
    });
  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="sectionTitle" accessibilityRole="header">Serviços públicos</AppText>
        <AppText variant="caption" color="muted">
          Quantidade não indica vagas nem qualidade do atendimento.
        </AppText>
        <InsetGroup>
          {serviceCategories.map(({ category }) => (
            <ListRow
              key={category}
              title={facilityLabels[category]}
              subtitle={countLabel(data.facilityCounts[category])}
              onPress={() => open(category)}
            />
          ))}
        </InsetGroup>
        <AppButton
          title={showSources ? 'Ocultar fontes dos serviços' : 'Ver fontes dos serviços'}
          variant="quiet"
          onPress={() => setShowSources((previous) => !previous)}
        />
        {showSources && serviceCategories.map(({ category, sourceId }) => {
          const source = data.sources.find((item) => item.sourceId === sourceId);
          if (!source) return null;
          return (
            <View key={category} style={{ gap: spacing.xxs }}>
              <AppText variant="label">{facilityLabels[category]}</AppText>
              <Provenance source={source} />
            </View>
          );
        })}
      </View>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="sectionTitle" accessibilityRole="header">Chamados do 1746</AppText>
        <AppText variant="title">{countLabel(data.calls.total)}</AppText>
        <AppText variant="caption" color="muted">
          Período consultado: {periodLabel(dates)}
        </AppText>
        <AppText variant="caption" color="muted">
          {coverageLabel(data.calls.coverage)}. Inclui chamados sem ponto no mapa.
        </AppText>
        <AppText variant="caption" color="muted">
          {data.calls.availableStart && data.calls.availableEnd
            ? `Dados de ${dayLabel(data.calls.availableStart)} a ${dayLabel(data.calls.availableEnd)}, que podem ter lacunas.`
            : 'Período disponível não confirmado para este bairro.'}
        </AppText>
        <AppInput
          showLabel
          label="Início (AAAA-MM-DD)"
          value={startDate}
          onChangeText={setStart}
          placeholder="2026-01-01"
        />
        <AppInput
          showLabel
          label="Fim (AAAA-MM-DD)"
          value={endDate}
          onChangeText={setEnd}
          placeholder="2026-01-31"
        />
        {dateError !== '' && (
          <AppText color="risk" accessibilityLiveRegion="polite">
            {dateError}
          </AppText>
        )}
        <AppButton
          title="Consultar período"
          variant="secondary"
          loading={updatingPeriod}
          onPress={() => {
            const valid = (v: string) =>
              /^\d{4}-\d{2}-\d{2}$/.test(v) &&
              Number.isFinite(Date.parse(v)) &&
              new Date(v).toISOString().slice(0, 10) === v;
            if (!valid(startDate) || !valid(endDate) || startDate > endDate) {
              setDateError('Informe datas válidas, com o fim após o início.');
              return;
            }
            setDateError('');
            onDates({ startDate, endDate });
          }}
        />
        {data.calls.topServices.map((service) => (
          <View key={service.type} style={{ flexDirection: 'row', gap: 12 }}>
            <AppText style={{ flex: 1 }}>{service.type}</AppText>
            <AppText variant="label">
              {service.count.toLocaleString('pt-BR')}
            </AppText>
          </View>
        ))}
        <AppButton
          title="Ver chamados deste período"
          disabled={updatingPeriod}
          onPress={() => open('official')}
        />
      </View>
      <AppText variant="caption" color="muted">
        Fontes: IPP e Prefeitura do Rio (Data.Rio).
      </AppText>
    </View>
  );
}
