import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { OccurrenceRow } from '@/components/occurrences/OccurrenceRow';
import { CivicRow, QueryState, createCityStyles } from '@/features/city/CityUI';
import { CityCarousel } from '@/features/city/CityCarousel';
import { useCityQuery } from '@/features/city/useCityQuery';
import type { CivicItem, Occurrence } from '@/shared/contracts';
import { useAuthStore } from '@/stores/authStore';
import { useFollowStore } from '@/stores/followStore';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

export default function FollowScreen() {
  const { colors } = useTheme();
  const cityStyles = useThemedStyles(createCityStyles);

  const municipalityId = useAuthStore((state) => state.user?.municipality?.id);
  const query = useCityQuery<{ occurrences: Occurrence[]; items: CivicItem[] }>(
    '/activity',
  );
  const [refreshing, setRefreshing] = useState(false);
  const { refetch } = query;
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const { statusFilter, toggleStatusFilter, setStatusFilter } = useFollowStore();

  const localOccurrences =
    query.data?.occurrences.filter(
      (item) => item.municipalityId === municipalityId,
    ) || [];
  const localItems =
    query.data?.items.filter(
      (item) => item.municipalityId === municipalityId,
    ) || [];

  const actions = localItems.filter((item) => item.kind === 'action');
  const proposals = localItems.filter((item) => item.kind === 'proposal');
  const consultations = localItems.filter(
    (item) => item.kind === 'consultation',
  );

  const isOpen = statusFilter === 'open';

  const occurrencesToDisplay = localOccurrences.filter((item) =>
    isOpen ? item.status !== 'resolved' : item.status === 'resolved',
  );
  const proposalsToDisplay = proposals.filter((item) =>
    isOpen
      ? ['submitted', 'under_review'].includes(item.status)
      : ['accepted', 'rejected'].includes(item.status),
  );
  const actionsToDisplay = actions.filter((item) =>
    isOpen ? item.status !== 'completed' : item.status === 'completed',
  );
  const consultationsToDisplay = consultations.filter((item) =>
    isOpen ? item.status === 'open' : ['closed', 'answered'].includes(item.status),
  );

  const hasLocalContent =
    occurrencesToDisplay.length > 0 ||
    actionsToDisplay.length > 0 ||
    proposalsToDisplay.length > 0 ||
    consultationsToDisplay.length > 0;

  const previous = [
    ...(query.data?.occurrences || []),
    ...(query.data?.items || []),
  ].filter((item) => item.municipalityId !== municipalityId);

  return (
    <AppScreen>
      <AppHeader title="Acompanhar" context="Minhas contribuições" />
      <ScrollView
        contentContainerStyle={[cityStyles.content, { flexGrow: 1 }]}
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refresh();
            }}
            tintColor={colors.ink}
            colors={[colors.ink]}
          />
        }
      >
        <QueryState
          loading={query.isPending}
          error={query.error}
          retry={query.refetch}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: colors.border,
            marginHorizontal: 16,
            marginBottom: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons
              name={isOpen ? 'time-outline' : 'checkmark-circle-outline'}
              size={16}
              color={isOpen ? colors.attention : colors.completed}
            />
            <AppText variant="caption" style={{ fontWeight: '600' }}>
              {isOpen
                ? 'Demandas em andamento'
                : 'Demandas resolvidas / concluídas'}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isOpen ? 'Ver demandas resolvidas' : 'Ver demandas em aberto'
            }
            onPress={toggleStatusFilter}
          >
            <AppText
              variant="caption"
              style={{ color: colors.attention, fontWeight: '700' }}
            >
              {isOpen ? 'Ver resolvidas' : 'Ver em aberto'}
            </AppText>
          </Pressable>
        </View>

        {query.data && !query.error && !hasLocalContent && (
          <IllustratedEmptyState
            title={
              isOpen
                ? 'Nenhuma demanda em andamento'
                : 'Nenhuma demanda resolvida ainda'
            }
            description={
              isOpen
                ? 'Todas as suas participações já foram atendidas ou você ainda não abriu novas demandas.'
                : 'Suas demandas concluídas pela prefeitura aparecerão aqui com a prestação de contas.'
            }
            action={{
              title: isOpen ? 'Ver resolvidas' : 'Ver em andamento',
              onPress: toggleStatusFilter,
            }}
          />
        )}

        {/* 1. Ações públicas em slide */}
        {actionsToDisplay.length > 0 && (
          <View style={cityStyles.section}>
            <AppText variant="sectionTitle">Ações públicas</AppText>
            <CityCarousel
              items={actionsToDisplay}
              label="Ações públicas que acompanho"
              renderItem={(item) => <CivicRow item={item} />}
            />
          </View>
        )}

        {/* 2. Ocorrências em slide */}
        {occurrencesToDisplay.length > 0 && (
          <View style={cityStyles.section}>
            <AppText variant="sectionTitle">Ocorrências</AppText>
            <CityCarousel
              items={occurrencesToDisplay}
              label="Ocorrências que acompanho"
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

        {/* 3. Propostas em slide */}
        {proposalsToDisplay.length > 0 && (
          <View style={cityStyles.section}>
            <AppText variant="sectionTitle">Propostas</AppText>
            <CityCarousel
              items={proposalsToDisplay}
              label="Propostas que acompanho"
              renderItem={(item) => <CivicRow item={item} />}
            />
          </View>
        )}

        {/* 4. Consultas públicas em slide */}
        {consultationsToDisplay.length > 0 && (
          <View style={cityStyles.section}>
            <AppText variant="sectionTitle">Consultas públicas</AppText>
            <CityCarousel
              items={consultationsToDisplay}
              label="Consultas públicas que participei"
              renderItem={(item) => <CivicRow item={item} />}
            />
          </View>
        )}

        {/* 5. Histórico de outros municípios */}
        {previous.length > 0 && (
          <View style={cityStyles.section}>
            <AppText variant="sectionTitle">
              Histórico de outros municípios
            </AppText>
            <AppText color="muted">
              Essas participações foram preservadas. Novos registros e
              interações ficam no município atual.
            </AppText>
            {previous.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={cityStyles.row}
                accessibilityRole="button"
                accessibilityLabel={'Abrir histórico: ' + item.title}
                onPress={() =>
                  router.push({
                    pathname: '/HistoricalDetailsScreen',
                    params: {
                      id: item.id,
                      kind: 'kind' in item ? 'civic-items' : 'occurrences',
                    },
                  })
                }
              >
                <AppText variant="label">{item.title}</AppText>
                <AppText color="muted">
                  Participação anterior à mudança de município
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
