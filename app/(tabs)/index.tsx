import { useTheme, useThemedStyles } from '@/theme/useTheme';
import { CitySearch } from '@/components/ui/CitySearch';
import { CityCarousel } from '@/features/city/CityCarousel';
import { ContributionActions } from '@/features/city/ContributionActions';
import { BottomSheet, RNHostView } from '@expo/ui';
import { spacing } from '@/theme/spacing';
import { OccurrenceRow } from '@/components/occurrences/OccurrenceRow';
import { AppButton } from '@/components/ui/AppButton';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { CivicRow, QueryState, createCityStyles } from '@/features/city/CityUI';
import { HomeHighlights } from '@/features/city/HomeHighlights';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { useCityQuery } from '@/features/city/useCityQuery';
import {
  cityHighlights,
  consultationIsOpen,
  isHomeOccurrence,
} from '@/shared/city-highlights';
import {
  civicTerritory,
  matchesNeighborhood,
  neighborhoodOptions,
  occurrenceMatchesNeighborhood,
} from '@/shared/civic-territory';
import type { CivicItem, Occurrence } from '@/shared/contracts';
import { useAuthStore } from '@/stores/authStore';
import { useTerritorySelection } from '@/stores/territoryStore';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  View,
  Platform,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';

export default function HomeScreen() {
  const { colors } = useTheme();
  const cityStyles = useThemedStyles(createCityStyles);

  const [captureOpen, setCaptureOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
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
  const localOccurrences = (occurrences.data || []).filter(
    (item) =>
      occurrenceMatchesNeighborhood(item, neighborhood) &&
      isHomeOccurrence(item, user?.id || ''),
  );
  const localActivity = (activity.data?.occurrences || []).filter(
    (item) =>
      item.municipalityId === user?.municipality?.id &&
      isHomeOccurrence(item, user?.id || '') &&
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
  const urgentHighlights = highlights.filter(
    (item) => item.kind === 'evaluation' || item.kind === 'consultation',
  );
  const responses = highlights.filter(
    (item) => item.kind !== 'evaluation' && item.kind !== 'consultation',
  );
  const featuredOccurrences = [...localOccurrences]
    .sort((a, b) => Number(Boolean(b.images[0])) - Number(Boolean(a.images[0])))
    .slice(0, 8);
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
  const pullRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        civic.refetch(),
        occurrences.refetch(),
        activity.refetch(),
      ]);
      setClock(Date.now());
    } finally {
      setRefreshing(false);
    }
  };
  return (
    <AppScreen>
      <AppHeader
        title={`Olá, ${user?.name ? user.name.split(' ')[0] : 'Vizinho'}`}
        rightElement={
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Participar com uma foto"
            onPress={() => setCaptureOpen(true)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="camera-outline" size={24} color={colors.ink} />
          </TouchableOpacity>
        }
        context={
          user?.municipality
            ? `${user.municipality.name} · ${user.municipality.state}`
            : 'Bem-vindo ao Fiscaliza aí'
        }
      />
      <ScrollView
        contentContainerStyle={[cityStyles.content, { flexGrow: 1 }]}
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void pullRefresh();
            }}
            tintColor={colors.ink}
            colors={[colors.ink]}
          />
        }
      >
        <CitySearch
          onPress={() => router.push('/(tabs)/TerritoryScreen')}
          onFilters={() =>
            router.push({
              pathname: '/(tabs)/TerritoryScreen',
              params: { filters: String(Date.now()) },
            })
          }
        />
        <View style={cityStyles.section}>
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
        {ready && !highlights.length && localOccurrences.length === 0 && (
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
        {localOccurrences.length > 0 && (
          <View style={cityStyles.section}>
            <AppText variant="sectionTitle">Ocorrências no território</AppText>
            <CityCarousel
              key={
                neighborhood +
                featuredOccurrences.map((item) => item.id).join(',')
              }
              items={featuredOccurrences}
              label="Ocorrências no território"
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
            ></CityCarousel>
          </View>
        )}
        {urgentHighlights.length > 0 && (
          <HomeHighlights items={urgentHighlights.slice(0, 1)} />
        )}
        {responses.length > 0 && (
          <HomeHighlights items={responses.slice(0, 1)} />
        )}
        {localItems.some((item) => item.kind === 'proposal') && (
          <View style={cityStyles.section}>
            <AppText variant="sectionTitle">Propostas da comunidade</AppText>
            <CityCarousel
              key={neighborhood + '-proposals'}
              label="Propostas da comunidade"
              items={localItems
                .filter((item) => item.kind === 'proposal')
                .slice(0, 6)}
              renderItem={(item) => <CivicRow item={item} />}
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
          <ContributionActions />
        </View>
        <AppButton
          title="Ver resultados deste território"
          variant="secondary"
          onPress={() => router.push('/ResultsScreen')}
        />
      </ScrollView>
      <BottomSheet
        isPresented={captureOpen}
        onDismiss={() => setCaptureOpen(false)}
        containerColor={colors.canvas}
        contentPadding={{
          left: spacing.contentPadding,
          right: spacing.contentPadding,
          bottom: spacing.xl,
        }}
      >
        <RNHostView matchContents={{ vertical: true }}>
          <View
            style={{
              gap: spacing.md,
              paddingTop: spacing.sm,
              width:
                Platform.OS === 'web'
                  ? '100%'
                  : Math.min(width, 640) - 2 * spacing.contentPadding,
              alignSelf: 'stretch',
            }}
          >
            <AppText variant="sectionTitle">O que você quer registrar?</AppText>
            <ContributionActions
              camera
              onChoose={() => setCaptureOpen(false)}
            />
          </View>
        </RNHostView>
      </BottomSheet>
    </AppScreen>
  );
}
