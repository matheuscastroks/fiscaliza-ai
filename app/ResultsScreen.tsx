import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { OccurrenceRow } from '@/components/occurrences/OccurrenceRow';
import { useCityQuery } from '@/features/city/useCityQuery';
import { CivicRow, QueryState, cityStyles } from '@/features/city/CityUI';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { useTerritorySelection } from '@/stores/territoryStore';
import { useAuthStore } from '@/stores/authStore';
import {
  matchesNeighborhood,
  neighborhoodOptions,
  occurrenceMatchesNeighborhood,
} from '@/shared/civic-territory';
import type { CivicItem, Occurrence } from '@/shared/contracts';
export default function ResultsScreen() {
  const civic = useCityQuery<CivicItem[]>('/civic-items');
  const occurrences = useCityQuery<Occurrence[]>('/occurrences');
  const profileNeighborhood = useAuthStore((state) => state.user?.neighborhood);
  const { neighborhood, setNeighborhood } = useTerritorySelection();
  const results =
    civic.data?.filter(
      (item) =>
        matchesNeighborhood(item, neighborhood) &&
        (item.status === 'completed' ||
          item.status === 'closed' ||
          item.status === 'accepted' ||
          item.status === 'declined'),
    ) || [];
  const resolved =
    occurrences.data?.filter(
      (item) =>
        item.status === 'resolved' &&
        occurrenceMatchesNeighborhood(item, neighborhood),
    ) || [];
  return (
    <AppScreen>
      <AppHeader title="Resultados da cidade" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={cityStyles.content}>
        <AppText variant="screenTitle">
          {neighborhood || 'Todo o município'}
        </AppText>
        <NeighborhoodPicker
          options={neighborhoodOptions(
            occurrences.data || [],
            civic.data || [],
            profileNeighborhood,
          )}
          value={neighborhood}
          onChange={setNeighborhood}
        />
        <AppText color="muted">
          Decisões publicadas, ações concluídas e atendimentos com retorno à
          comunidade.
        </AppText>
        {Boolean(neighborhood) && (
          <AppText variant="caption" color="muted">
            Iniciativas municipais também aparecem neste recorte, com sua
            abrangência identificada.
          </AppText>
        )}
        <QueryState
          loading={civic.isPending || occurrences.isPending}
          error={civic.error || occurrences.error}
          retry={() => {
            void civic.refetch();
            void occurrences.refetch();
          }}
        />
        <View style={cityStyles.section}>
          <AppText variant="sectionTitle">Decisões e entregas</AppText>
          {results.map((item) => (
            <CivicRow key={item.id} item={item} />
          ))}
          {civic.data && results.length === 0 && (
            <AppText color="muted">
              Ainda não há decisões ou ações concluídas publicadas neste
              recorte.
            </AppText>
          )}
        </View>
        <View style={cityStyles.section}>
          <AppText variant="sectionTitle">Atendimentos concluídos</AppText>
          {resolved.map((item) => (
            <OccurrenceRow
              key={item.id}
              problem={item}
              onPress={() =>
                router.push({
                  pathname: '/ProblemDetailsScreen',
                  params: { id: item.id },
                })
              }
            />
          ))}
          {occurrences.data && resolved.length === 0 && (
            <AppText color="muted">
              Os atendimentos aparecerão aqui quando a gestão publicar a
              conclusão.
            </AppText>
          )}
        </View>
      </ScrollView>
    </AppScreen>
  );
}
