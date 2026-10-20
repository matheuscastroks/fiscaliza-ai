import { useThemedStyles } from '@/theme/useTheme';
import { goBack } from '@/utils/navigation';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { OccurrenceRow } from '@/components/occurrences/OccurrenceRow';
import { useCityQuery } from '@/features/city/useCityQuery';
import { CivicRow, QueryState, createCityStyles } from '@/features/city/CityUI';
import { CityCarousel } from '@/features/city/CityCarousel';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { useTerritorySelection } from '@/stores/territoryStore';
import { useAuthStore } from '@/stores/authStore';
import {
  matchesNeighborhood,
  neighborhoodOptions,
  occurrenceMatchesNeighborhood,
} from '@/shared/civic-territory';
import type { CivicItem, Occurrence } from '@/shared/contracts';
import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';

export default function ResultsScreen() {
  const cityStyles = useThemedStyles(createCityStyles);

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

  const completedActions = results.filter((item) => item.kind === 'action');
  const decidedProposals = results.filter((item) => item.kind === 'proposal');
  const closedConsultations = results.filter(
    (item) => item.kind === 'consultation',
  );

  const hasResults =
    completedActions.length > 0 ||
    decidedProposals.length > 0 ||
    closedConsultations.length > 0 ||
    resolved.length > 0;

  return (
    <AppScreen>
      <AppHeader title="Resultados da cidade" onBack={() => goBack()} />
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
        {civic.data &&
        occurrences.data &&
        !civic.error &&
        !occurrences.error &&
        !hasResults ? (
          <IllustratedEmptyState
            kind="target"
            title="Nenhum resultado neste recorte"
            description={
              neighborhood
                ? 'Ainda não há decisões ou atendimentos concluídos para este bairro. Você pode selecionar outro bairro ou ver todo o município.'
                : 'Decisões publicadas, ações concluídas e atendimentos com retorno à comunidade aparecerão aqui assim que a gestão prestar contas.'
            }
            action={
              neighborhood
                ? {
                    title: 'Ver todo o município',
                    onPress: () => setNeighborhood(''),
                  }
                : undefined
            }
          />
        ) : (
          <>
            {completedActions.length > 0 && (
              <View style={cityStyles.section}>
                <AppText variant="sectionTitle">
                  Ações públicas concluídas
                </AppText>
                <CityCarousel
                  key={neighborhood + '-actions'}
                  label="Ações públicas concluídas"
                  items={completedActions}
                  renderItem={(item) => <CivicRow item={item} />}
                />
              </View>
            )}

            {resolved.length > 0 && (
              <View style={cityStyles.section}>
                <AppText variant="sectionTitle">Atendimentos concluídos</AppText>
                <CityCarousel
                  key={neighborhood + '-resolved'}
                  label="Atendimentos concluídos"
                  items={resolved}
                  renderItem={(problem) => (
                    <OccurrenceRow
                      problem={problem}
                      featured
                      onPress={() =>
                        router.push({
                          pathname: '/ProblemDetailsScreen',
                          params: { id: problem.id },
                        })
                      }
                    />
                  )}
                />
              </View>
            )}

            {decidedProposals.length > 0 && (
              <View style={cityStyles.section}>
                <AppText variant="sectionTitle">Propostas decididas</AppText>
                <CityCarousel
                  key={neighborhood + '-proposals'}
                  label="Propostas decididas"
                  items={decidedProposals}
                  renderItem={(item) => <CivicRow item={item} />}
                />
              </View>
            )}

            {closedConsultations.length > 0 && (
              <View style={cityStyles.section}>
                <AppText variant="sectionTitle">Consultas encerradas</AppText>
                <CityCarousel
                  key={neighborhood + '-consultations'}
                  label="Consultas encerradas"
                  items={closedConsultations}
                  renderItem={(item) => <CivicRow item={item} />}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}
