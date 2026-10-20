import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useTheme } from '@/theme/useTheme';
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
export function NeighborhoodOverview({
  data,
  onDates,
}: {
  data: Overview;
  onDates: (dates: { startDate: string; endDate: string }) => void;
}) {
  const { colors } = useTheme();
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
      params: evidenceScope(data.neighborhood.id, layer, dates),
    });
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 6 }}>
        <AppText variant="title">{data.neighborhood.name}</AppText>
        <AppText color="muted">
          Serviços públicos e demandas do território.
        </AppText>
      </View>
      <View style={{ gap: 12 }}>
        <AppText variant="sectionTitle">Equipamentos municipais</AppText>
        <AppText variant="caption" color="muted">
          Cadastros com bairro confirmado. Quantidade não indica capacidade ou
          qualidade do atendimento.
        </AppText>
        {(['school', 'health', 'square'] as const).map((category) => {
          const source = data.sources.find(
            (s) =>
              s.sourceId ===
              {
                school: 'siurb-schools',
                health: 'siurb-health',
                square: 'siurb-squares',
              }[category],
          );
          return (
            <View
              key={category}
              style={{
                padding: 18,
                gap: 10,
                borderRadius: 24,
                backgroundColor: colors.surface,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <AppText variant="label" style={{ flex: 1 }}>
                  {facilityLabels[category]}
                </AppText>
                <AppText variant="sectionTitle">
                  {countLabel(data.facilityCounts[category])}
                </AppText>
              </View>
              {source && <Provenance source={source} />}
              <AppButton
                title={`Explorar ${facilityLabels[category].toLowerCase()}`}
                variant="secondary"
                onPress={() => open(category)}
              />
            </View>
          );
        })}
      </View>
      <View style={{ gap: 12 }}>
        <AppText variant="sectionTitle">Demandas · Central 1746</AppText>
        <AppText variant="title">{countLabel(data.calls.total)}</AppText>
        <AppText variant="caption" color="muted">
          Período consultado: {periodLabel(dates)}
        </AppText>
        <AppText variant="caption" color="muted">
          {coverageLabel(data.calls.coverage)}. Registros sem coordenadas
          participam da contagem, mas não aparecem no mapa.
        </AppText>
        <AppText variant="caption" color="muted">
          Extensão disponível:{' '}
          {data.calls.availableStart && data.calls.availableEnd
            ? `${dayLabel(data.calls.availableStart)} a ${dayLabel(data.calls.availableEnd)}`
            : 'não confirmada para este bairro'}
          . Não comprova dados contínuos entre as datas.
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
          title="Ver demandas deste período"
          onPress={() => open('official')}
        />
      </View>
      <AppText variant="caption" color="muted">
        Fontes: IPP / Prefeitura da Cidade do Rio de Janeiro (SIURB) e DATA.RIO
        (1746). Fiscaliza Aí é independente. Proximidade não estabelece
        responsabilidade, área de atendimento ou relação causal.
      </AppText>
    </View>
  );
}
