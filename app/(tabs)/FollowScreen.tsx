import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import React, { useState, useCallback, useMemo } from 'react';
import {
  ScrollView,
  View,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppSelect } from '@/components/ui/AppSelect';
import { SlidingTabs } from '@/components/ui/SlidingTabs';
import { QueryState, createCityStyles } from '@/features/city/CityUI';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import {
  useOfficialCalls,
  useOfficialFilters,
} from '@/features/city/useOfficialCalls';
import { OfficialCallRow } from '@/components/official/OfficialCallRow';
import { useFollowStore, type FollowStatusFilter } from '@/stores/followStore';
import { useTerritorySelection } from '@/stores/territoryStore';
import { spacing } from '@/theme/spacing';

export default function FollowScreen() {
  const { colors } = useTheme();
  const cityStyles = useThemedStyles(createCityStyles);

  const { statusFilter, setStatusFilter, savedCalls } = useFollowStore();
  const { neighborhood, setNeighborhood } = useTerritorySelection();
  const [serviceType, setServiceType] = useState<string>('all');
  const [pageLimit, setPageLimit] = useState<number>(50);

  const isSavedTab = statusFilter === 'saved';
  const isOpenTab = statusFilter === 'open';

  const officialFilters = useOfficialFilters();
  const query = useOfficialCalls(
    {
      bairro: neighborhood || undefined,
      tipo: serviceType === 'all' ? undefined : serviceType,
      situacao: isOpenTab ? 'Não Encerrado' : 'Encerrado',
      limit: pageLimit,
    },
    !isSavedTab,
  );

  const [refreshing, setRefreshing] = useState(false);
  const { refetch } = query;
  const refresh = useCallback(async () => {
    if (isSavedTab) return;
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch, isSavedTab]);

  const bairroOptions = officialFilters.data?.bairros || [];
  const serviceOptions = useMemo(() => {
    const tipos = officialFilters.data?.tipos || [];
    return [
      { value: 'all', label: 'Todos os serviços' },
      ...tipos.map((t) => ({ value: t, label: t })),
    ];
  }, [officialFilters.data?.tipos]);

  const filteredSavedCalls = useMemo(() => {
    return savedCalls.filter((call) => {
      if (
        neighborhood &&
        call.neighborhoodName?.toLowerCase() !== neighborhood.toLowerCase()
      ) {
        return false;
      }
      if (serviceType !== 'all' && call.serviceType !== serviceType) {
        return false;
      }
      return true;
    });
  }, [savedCalls, neighborhood, serviceType]);

  const calls = isSavedTab ? filteredSavedCalls : query.data?.calls || [];
  const total = isSavedTab
    ? filteredSavedCalls.length
    : query.data?.total ?? 0;
  const hasMore = !isSavedTab && Boolean(query.data?.hasMore && pageLimit < 500);

  return (
    <AppScreen>
      <AppHeader
        title="Situação dos chamados"
        context="Central 1746 · Em atendimento, encerrados e salvos"
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
        <View style={{ gap: spacing.xs }}>
          <SlidingTabs
            label="Situação dos chamados"
            scroll={false}
            edgeToEdge={false}
            options={[
              { value: 'open', label: 'Em aberto' },
              { value: 'resolved', label: 'Encerrados' },
              {
                value: 'saved',
                label: `Salvos (${savedCalls.length})`,
              },
            ]}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val as FollowStatusFilter);
              setPageLimit(50);
            }}
          />

          <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
            <NeighborhoodPicker
              compact
              options={bairroOptions}
              value={neighborhood}
              onChange={(val) => {
                setNeighborhood(val);
                setPageLimit(50);
              }}
            />
            <AppSelect
              compact
              label="Tipo de serviço 1746"
              placeholder="Buscar serviço..."
              icon="construct-outline"
              defaultValue="all"
              options={serviceOptions}
              value={serviceType}
              onChange={(val) => {
                setServiceType(val);
                setPageLimit(50);
              }}
            />
          </View>
        </View>

        {!isSavedTab && (
          <QueryState
            loading={query.isPending}
            error={query.error}
            retry={query.refetch}
          />
        )}

        {(!query.isPending || isSavedTab) &&
          !query.error &&
          calls.length === 0 && (
            <IllustratedEmptyState
              title={
                isSavedTab
                  ? 'Nenhum chamado salvo para acompanhar'
                  : isOpenTab
                    ? 'Nenhum chamado em atendimento neste recorte'
                    : 'Nenhum chamado encerrado neste recorte'
              }
              description={
                isSavedTab
                  ? 'Abra qualquer chamado do 1746 no mapa ou na lista e toque em "Salvar" para acompanhá-lo aqui.'
                  : 'Não há chamados para os filtros de bairro e serviço selecionados.'
              }
              action={{
                title: isSavedTab
                  ? 'Explorar chamados em aberto'
                  : isOpenTab
                    ? 'Ver encerrados'
                    : 'Ver em aberto',
                onPress: () =>
                  setStatusFilter(isSavedTab ? 'open' : isOpenTab ? 'resolved' : 'open'),
              }}
            />
          )}

        {calls.length > 0 && (
          <View style={cityStyles.section}>
            <AppText variant="sectionTitle">
              {isSavedTab
                ? 'Chamados salvos'
                : isOpenTab
                  ? 'Em atendimento'
                  : 'Encerrados'}{' '}
              ({total.toLocaleString('pt-BR')})
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
            {hasMore && (
              <AppButton
                title={`Carregar mais (${calls.length} de ${total.toLocaleString('pt-BR')})`}
                variant="secondary"
                onPress={() => setPageLimit((prev) => Math.min(500, prev + 100))}
              />
            )}
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
