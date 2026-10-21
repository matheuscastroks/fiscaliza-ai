import React, { useState } from 'react';
import { ScrollView, View, RefreshControl } from 'react-native';
import { router, useIsFocused } from 'expo-router';
import { useThemedStyles, useTheme } from '@/theme/useTheme';
import { spacing } from '@/theme';
import { CitySearch } from '@/components/ui/CitySearch';
import { AppButton } from '@/components/ui/AppButton';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { SlidingTabs } from '@/components/ui/SlidingTabs';
import { QueryState, createCityStyles } from '@/features/city/CityUI';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { useOfficialCalls } from '@/features/city/useOfficialCalls';
import { OfficialCallRow } from '@/components/official/OfficialCallRow';
import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';
import {
  useTerritorySelection,
  useTerritoryStore,
} from '@/stores/territoryStore';
import { useFollowStore } from '@/stores/followStore';
import { CitizenAction } from '@/features/city/CitizenAction';

export default function HomeScreen() {
  const active = useIsFocused();
  const { colors } = useTheme();
  const styles = useThemedStyles(createCityStyles);
  const [refreshing, setRefreshing] = useState(false);
  const { neighborhood, neighborhoodId, setNeighborhood } =
    useTerritorySelection();
  const preferred = useTerritoryStore((s) => s.preferredNeighborhood);
  const saved = useFollowStore((s) => s.savedCalls);
  const hydrated = useFollowStore((s) => s.hydrated);
  const calls = useOfficialCalls(
    {
      neighborhoodId,
      bairro: neighborhoodId ? undefined : neighborhood || undefined,
      limit: 5,
    },
    active,
  );
  const explore = () => router.push('/(tabs)/TerritoryScreen');
  return (
    <AppScreen>
      <AppHeader title="Sua região" context="Rio de Janeiro · RJ" />
      <ScrollView
        contentContainerStyle={styles.content}
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.ink}
            colors={[colors.ink]}
            onRefresh={() => {
              setRefreshing(true);
              void calls.refetch().finally(() => setRefreshing(false));
            }}
          />
        }
      >
        <CitySearch
          onPress={explore}
          onFilters={() =>
            router.push({
              pathname: '/(tabs)/TerritoryScreen',
              params: { filters: String(Date.now()) },
            })
          }
        />
        <View style={{ gap: spacing.sm }}>
          {Boolean(preferred || neighborhood) && (
            <SlidingTabs
              label="Região das demandas"
              value={neighborhood}
              options={[
                { value: '', label: 'Todo o município' },
                ...(preferred ? [{ value: preferred, label: preferred }] : []),
                ...(neighborhood && neighborhood !== preferred
                  ? [{ value: neighborhood, label: neighborhood }]
                  : []),
              ]}
              onChange={setNeighborhood}
            />
          )}
          <NeighborhoodPicker
            compact
            options={[]}
            value={neighborhood}
            onChange={setNeighborhood}
          />
        </View>
        <CitizenAction
          title="Explorar minha região"
          description="Demandas e serviços públicos no mapa"
          icon="map-outline"
          primary
          onPress={explore}
        />
        {hydrated && saved.length > 0 && (
          <View style={styles.section}>
            <AppText variant="sectionTitle">Estou acompanhando</AppText>
            <AppText variant="caption" color="muted">
              Salvos neste aparelho · última informação consultada
            </AppText>
            {saved.slice(0, 3).map((call) => (
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
            <AppButton
              title="Ver meus salvos"
              variant="secondary"
              onPress={() => router.push('/(tabs)/FollowScreen')}
            />
          </View>
        )}
        <View style={styles.section}>
          <AppText variant="sectionTitle">
            O que acontece {neighborhood ? `em ${neighborhood}` : 'na cidade'}?
          </AppText>
          <AppText variant="caption" color="muted">
            Demandas recentes na base disponível. A data de abertura aparece em
            cada registro.
          </AppText>
          <QueryState
            loading={calls.isLoading}
            error={calls.error}
            retry={calls.refetch}
          />
          {calls.fetchStatus === 'paused' && (
            <AppText color="muted">
              Sem conexão. Os registros disponíveis voltam a ser atualizados
              quando a rede retornar.
            </AppText>
          )}
          {!calls.isPending && !calls.error && !calls.data?.calls.length && (
            <IllustratedEmptyState
              kind="territory"
              title="Nenhum registro neste recorte"
              description="A base sincronizada não contém registros para este filtro. Isso não significa ausência de chamados no 1746."
              action={{ title: 'Explorar outro recorte', onPress: explore }}
            />
          )}
          {calls.data?.calls.map((call) => (
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
          <AppButton
            title="Explorar demandas"
            variant="secondary"
            onPress={explore}
          />
        </View>
        <CitizenAction
          title="Precisa solicitar um serviço?"
          description="Encontre o atendimento oficial da prefeitura"
          icon="open-outline"
          onPress={() => router.push('/(tabs)/ParticipateScreen')}
        />
      </ScrollView>
    </AppScreen>
  );
}
