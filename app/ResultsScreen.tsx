import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { OccurrenceRow } from '@/components/occurrences/OccurrenceRow';
import { useCityQuery } from '@/features/city/useCityQuery';
import { CivicRow, QueryState, cityStyles } from '@/features/city/CityUI';
import type { CivicItem, Occurrence } from '@/shared/contracts';
export default function ResultsScreen() {
  const civic = useCityQuery<CivicItem[]>('/civic-items');
  const occurrences = useCityQuery<Occurrence[]>('/occurrences');
  const results =
    civic.data?.filter(
      (i) =>
        i.status === 'completed' ||
        i.status === 'closed' ||
        i.status === 'accepted' ||
        i.status === 'declined',
    ) || [];
  return (
    <AppScreen>
      <AppHeader title="Resultados da cidade" onBack={() => router.back()} />
      <AppScreen scroll>
        <View style={cityStyles.section}>
          <AppText color="muted">
            Decisões publicadas, ações concluídas e atendimentos com retorno à
            comunidade.
          </AppText>
          <QueryState
            loading={civic.isPending || occurrences.isPending}
            error={civic.error || occurrences.error}
            retry={() => {
              void civic.refetch();
              void occurrences.refetch();
            }}
          />
          {results.map((i) => (
            <CivicRow key={i.id} item={i} />
          ))}
          {civic.data && !results.length && (
            <AppText color="muted">
              Ainda não há decisões ou ações concluídas publicadas.
            </AppText>
          )}
          <AppText variant="sectionTitle">Atendimentos concluídos</AppText>
          {occurrences.data
            ?.filter((p) => p.status === 'resolved')
            .map((p) => (
              <OccurrenceRow
                key={p.id}
                problem={p}
                onPress={() =>
                  router.push({
                    pathname: '/ProblemDetailsScreen',
                    params: { id: p.id },
                  })
                }
              />
            ))}
          {occurrences.data &&
            !occurrences.data.some((p) => p.status === 'resolved') && (
              <AppText color="muted">
                Os atendimentos aparecerão aqui quando a gestão publicar a
                conclusão.
              </AppText>
            )}
        </View>
      </AppScreen>
    </AppScreen>
  );
}
