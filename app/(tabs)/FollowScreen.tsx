import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { QueryState, createCityStyles } from '@/features/city/CityUI';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import {
  useOfficialCalls,
  useOfficialFilters,
} from '@/features/city/useOfficialCalls';
import { OfficialCallRow } from '@/components/official/OfficialCallRow';
import { useFollowStore } from '@/stores/followStore';
import { useTerritorySelection } from '@/stores/territoryStore';
import { spacing } from '@/theme/spacing';

export default function FollowScreen() {
  const { colors } = useTheme();
  const cityStyles = useThemedStyles(createCityStyles);

  const { statusFilter, toggleStatusFilter } = useFollowStore();
  const { neighborhood, setNeighborhood } = useTerritorySelection();
  const isOpen = statusFilter === 'open';

  const officialFilters = useOfficialFilters();
  const query = useOfficialCalls({
    bairro: neighborhood || undefined,
    situacao: isOpen ? 'Não Encerrado' : 'Encerrado',
    limit: 50,
  });

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

  const calls = query.data?.calls || [];
  const total = query.data?.total ?? 0;
  const bairroOptions = officialFilters.data?.bairros || [];

  return (
    <AppScreen>
      <AppHeader
        title="Acompanhar · 1746"
        context={
          isOpen
            ? 'Chamados oficiais em atendimento'
            : 'Chamados oficiais encerrados'
        }
      />
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
        <View style={cityStyles.section}>
          <NeighborhoodPicker
            options={bairroOptions}
            value={neighborhood}
            onChange={setNeighborhood}
          />
        </View>

        <QueryState
          loading={query.isPending}
          error={query.error}
          retry={query.refetch}
        />

        {!query.isPending && !query.error && calls.length === 0 && (
          <IllustratedEmptyState
            title={
              isOpen
                ? 'Nenhum chamado em atendimento neste recorte'
                : 'Nenhum chamado encerrado neste recorte'
            }
            description={
              isOpen
                ? 'Não há chamados em aberto para o filtro selecionado.'
                : 'Não há chamados encerrados para o filtro selecionado.'
            }
            action={{
              title: isOpen ? 'Ver encerrados' : 'Ver em atendimento',
              onPress: toggleStatusFilter,
            }}
          />
        )}

        {calls.length > 0 && (
          <View style={cityStyles.section}>
            <AppText variant="sectionTitle">
              {isOpen ? 'Em atendimento' : 'Encerrados'} ({total.toLocaleString('pt-BR')})
            </AppText>
            <View style={{ gap: spacing.xs }}>
              {calls.map((call) => (
                <OfficialCallRow
                  key={call.id}
                  call={call}
                  onPress={() =>
                    router.push({
                      pathname: '/OfficialCallDetailsScreen',
                      params: { id: call.id },
                    })
                  }
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
