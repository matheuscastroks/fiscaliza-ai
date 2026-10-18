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
import { CivicRow, QueryState, cityStyles } from '@/features/city/CityUI';
import { useCityQuery } from '@/features/city/useCityQuery';
import type { CivicItem, Occurrence } from '@/shared/contracts';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';
export default function FollowScreen() {
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
  const localOccurrences =
    query.data?.occurrences.filter(
      (item) => item.municipalityId === municipalityId,
    ) || [];
  const localItems =
    query.data?.items.filter(
      (item) => item.municipalityId === municipalityId,
    ) || [];
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
        <View style={cityStyles.section}>
          <AppText variant="sectionTitle">
            Ocorrências que registrei ou acompanho
          </AppText>
          {localOccurrences.map((i) => (
            <OccurrenceRow
              key={i.id}
              problem={i}
              onPress={() =>
                router.push({
                  pathname: '/ProblemDetailsScreen',
                  params: { id: i.id },
                })
              }
            />
          ))}
          {query.data && !localOccurrences.length && (
            <AppText color="muted">
              Você ainda não registrou nem acompanhou uma ocorrência.
            </AppText>
          )}
        </View>
        <View style={cityStyles.section}>
          <AppText variant="sectionTitle">Propostas, consultas e ações</AppText>
          {localItems.map((i) => (
            <CivicRow key={i.id} item={i} />
          ))}
          {query.data && !localItems.length && (
            <AppText color="muted">
              Participe de uma consulta ou acompanhe uma ação para encontrá-la
              aqui.
            </AppText>
          )}
        </View>
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
