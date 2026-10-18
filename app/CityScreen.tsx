import { goBack } from '@/utils/navigation';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useCityQuery } from '@/features/city/useCityQuery';
import { QueryState, cityStyles } from '@/features/city/CityUI';
import { useTerritorySelection } from '@/stores/territoryStore';
import type { CityOverview } from '@/shared/contracts';
import { useAuthStore } from '@/stores/authStore';
export default function CityScreen() {
  const query = useCityQuery<CityOverview>('/overview');
  const municipality = useAuthStore((state) => state.user?.municipality);
  const { setNeighborhood } = useTerritorySelection();
  const municipal = query.data?.municipalScope;
  return (
    <AppScreen>
      <AppHeader title="Município e bairros" onBack={() => goBack()} />
      <ScrollView contentContainerStyle={cityStyles.content}>
        <AppText variant="screenTitle">{municipality?.name}</AppText>
        <AppText color="muted">{municipality?.state}</AppText>
        <QueryState
          loading={query.isPending}
          error={query.error}
          retry={query.refetch}
        />
        {query.data && (
          <>
            <AppText>
              {query.data.occurrences} ocorrências registradas ·{' '}
              {query.data.resolved} concluídas
            </AppText>
            {municipal &&
              municipal.actions +
                municipal.proposals +
                municipal.consultations >
                0 && (
                <AppText color="muted">
                  Em todo o município: {municipal.proposals} propostas,{' '}
                  {municipal.consultations} consultas e {municipal.actions}{' '}
                  ações.
                </AppText>
              )}
            <AppText variant="sectionTitle">Por bairro</AppText>
            {query.data.neighborhoods.map((item) => (
              <View key={item.name} style={cityStyles.row}>
                <AppText variant="sectionTitle">{item.name}</AppText>
                <AppText color="muted">
                  {item.occurrences} ocorrências · {item.resolved} concluídas
                </AppText>
                <AppText color="muted">
                  {item.proposals ?? 0} propostas · {item.consultations ?? 0}{' '}
                  consultas · {item.actions} ações
                </AppText>
                {item.name !== 'Sem bairro informado' && (
                  <AppButton
                    title={'Explorar ' + item.name}
                    variant="quiet"
                    onPress={() => {
                      setNeighborhood(item.name);
                      router.push('/(tabs)/TerritoryScreen');
                    }}
                  />
                )}
              </View>
            ))}
            {!query.data.neighborhoods.length && (
              <AppText color="muted">
                Ainda não há contribuições associadas a bairros.
              </AppText>
            )}
            <AppText color="muted">
              Os números representam as contribuições registradas na plataforma.
              Não são uma medição de todos os problemas ou moradores da cidade.
            </AppText>
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}
