import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { OccurrenceRow } from '@/components/occurrences/OccurrenceRow';
import { CivicRow, QueryState, cityStyles } from '@/features/city/CityUI';
import { HomeHighlights } from '@/features/city/HomeHighlights';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { useCityQuery } from '@/features/city/useCityQuery';
import { useTerritorySelection } from '@/stores/territoryStore';
import {
  civicTerritory,
  matchesNeighborhood,
  neighborhoodOptions,
  occurrenceMatchesNeighborhood,
} from '@/shared/civic-territory';
import { cityHighlights, consultationIsOpen } from '@/shared/city-highlights';
import type { CivicItem, Occurrence } from '@/shared/contracts';
import { useAuthStore } from '@/stores/authStore';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { neighborhood, setNeighborhood } = useTerritorySelection();
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const civic = useCityQuery<CivicItem[]>('/civic-items');
  const occurrences = useCityQuery<Occurrence[]>('/occurrences');
  const activity = useCityQuery<{
    occurrences: Occurrence[];
    items: CivicItem[];
  }>('/activity');
  const localItems = (civic.data || []).filter((item) =>
    matchesNeighborhood(item, neighborhood),
  );
  const localOccurrences = (occurrences.data || []).filter((item) =>
    occurrenceMatchesNeighborhood(item, neighborhood),
  );
  const localActivity = (activity.data?.occurrences || []).filter(
    (item) =>
      item.municipalityId === user?.municipality?.id &&
      occurrenceMatchesNeighborhood(item, neighborhood),
  );
  const consultations = localItems
    .filter((item) => consultationIsOpen(item, clock))
    .sort(
      (a, b) => new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime(),
    );
  const actions = localItems.filter(
    (item) => item.kind === 'action' && item.status !== 'completed',
  );
  const highlights = cityHighlights(
    localActivity,
    localItems,
    user?.id || '',
    clock,
  );
  const municipalCount = neighborhood
    ? localItems.filter((item) => civicTerritory(item).scope === 'municipality')
        .length
    : 0;
  const ready = Boolean(civic.data && occurrences.data && activity.data);
  const refresh = () => {
    void civic.refetch();
    void occurrences.refetch();
    void activity.refetch();
  };
  return (
    <AppScreen>
      <AppHeader
        title="Minha cidade"
        context={
          user?.municipality
            ? `${user.municipality.name} · ${user.municipality.state}`
            : 'Seu município'
        }
      />
      <ScrollView contentContainerStyle={cityStyles.content}>
        <View style={cityStyles.section}>
          <AppText variant="caption" color="muted">
            {new Date(clock).toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'long',
            })}
          </AppText>
          <AppText variant="screenTitle">
            Agora em {neighborhood || user?.municipality?.name || 'sua cidade'}
          </AppText>
          <NeighborhoodPicker
            options={neighborhoodOptions(
              occurrences.data || [],
              civic.data || [],
              user?.neighborhood,
            )}
            value={neighborhood}
            onChange={setNeighborhood}
          />
          {civic.data && occurrences.data && (
            <AppText color="muted">
              {
                localOccurrences.filter((item) => item.status === 'in_progress')
                  .length
              }{' '}
              atendimentos em andamento · {consultations.length} consultas
              abertas
            </AppText>
          )}
          {municipalCount > 0 && (
            <AppText variant="caption" color="muted">
              Inclui {municipalCount}{' '}
              {municipalCount === 1
                ? 'iniciativa de abrangência municipal'
                : 'iniciativas de abrangência municipal'}
              .
            </AppText>
          )}
        </View>
        <QueryState
          loading={
            civic.isPending || activity.isPending || occurrences.isPending
          }
          error={civic.error || activity.error || occurrences.error}
          retry={refresh}
        />
        {highlights.length > 0 && <HomeHighlights items={highlights} />}
        {ready && !highlights.length && (
          <View style={cityStyles.section}>
            <AppText variant="sectionTitle">Acompanhe este território</AppText>
            <AppText color="muted">
              Não há novas respostas, consultas próximas do encerramento ou
              entregas recentes neste recorte.
            </AppText>
            <AppButton
              title="Explorar o território"
              variant="secondary"
              onPress={() => router.push('/(tabs)/TerritoryScreen')}
            />
          </View>
        )}
        <View style={cityStyles.section}>
          <AppText variant="sectionTitle">
            Decisões abertas à participação
          </AppText>
          {consultations.slice(0, 3).map((item) => (
            <CivicRow key={item.id} item={item} />
          ))}
          {civic.data && consultations.length === 0 && (
            <AppText color="muted">
              Nenhuma consulta com prazo aberto neste recorte.
            </AppText>
          )}
        </View>
        <View style={cityStyles.section}>
          <AppText variant="sectionTitle">Ações públicas</AppText>
          {actions.slice(0, 3).map((item) => (
            <CivicRow key={item.id} item={item} />
          ))}
          {civic.data && actions.length === 0 && (
            <AppText color="muted">
              Nenhuma ação programada ou em andamento neste recorte.
            </AppText>
          )}
        </View>
        <View style={cityStyles.section}>
          <AppText variant="sectionTitle">Meus acompanhamentos</AppText>
          {localActivity.slice(0, 2).map((item) => (
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
          {activity.data && localActivity.length === 0 && (
            <AppText color="muted">
              Seus registros e acompanhamentos deste território aparecerão aqui.
            </AppText>
          )}
          <AppButton
            title="Ver todos os acompanhamentos"
            variant="quiet"
            onPress={() => router.push('/(tabs)/FollowScreen')}
          />
        </View>
        <View style={cityStyles.section}>
          <AppText variant="sectionTitle">Contribuir com a cidade</AppText>
          <AppButton
            title="Registrar uma ocorrência"
            variant="secondary"
            onPress={() => router.push('/(tabs)/ReportScreen')}
          />
          <AppButton
            title="Propor uma melhoria"
            variant="quiet"
            onPress={() => router.push('/ProposalScreen')}
          />
        </View>
        <AppButton
          title="Ver resultados deste território"
          variant="secondary"
          onPress={() => router.push('/ResultsScreen')}
        />
      </ScrollView>
    </AppScreen>
  );
}
