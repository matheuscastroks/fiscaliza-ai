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

  const user = useAuthStore((state) => state.user);
  const { onlyMine, setOnlyMine } = useFollowStore();

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

  const occurrencesToDisplay = onlyMine
    ? localOccurrences.filter(
        (item) => item.reportedBy === user?.id,
      )
    : localOccurrences;
  const proposalsToDisplay = onlyMine
    ? proposals.filter((item) => item.createdBy === user?.id)
    : proposals;
  const actionsToDisplay = onlyMine ? [] : actions;
  const consultationsToDisplay = onlyMine ? [] : consultations;

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

        {onlyMine && (
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
              <Ionicons name="filter" size={16} color={colors.ink} />
              <AppText variant="caption" style={{ fontWeight: '600' }}>
                Mostrando apenas criadas por você
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver todas as participações"
              onPress={() => setOnlyMine(false)}
            >
              <AppText
                variant="caption"
                style={{ color: colors.attention, fontWeight: '700' }}
              >
                Ver todas
              </AppText>
            </Pressable>
          </View>
        )}

        {query.data && !query.error && !hasLocalContent && (
          <IllustratedEmptyState
            title={onlyMine ? 'Nenhum registro próprio encontrado' : 'Seus acompanhamentos ficam aqui'}
            description={
              onlyMine
                ? 'Você ainda não criou ocorrências ou propostas neste município.'
                : 'Registre uma ocorrência ou acompanhe uma participação para ver as respostas da gestão.'
            }
            action={{
              title: onlyMine ? 'Ver todas as participações' : 'Explorar território',
              onPress: () => {
                if (onlyMine) setOnlyMine(false);
                else router.push('/(tabs)/TerritoryScreen');
              },
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
