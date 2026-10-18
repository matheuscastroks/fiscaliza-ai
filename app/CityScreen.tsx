import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { useCityQuery } from '@/features/city/useCityQuery';
import { QueryState, cityStyles } from '@/features/city/CityUI';
import type { CityOverview } from '@/shared/contracts';
import { useAuthStore } from '@/stores/authStore';
export default function CityScreen() {
  const query = useCityQuery<CityOverview>('/overview');
  const municipality = useAuthStore((state) => state.user?.municipality);
  return (
    <AppScreen>
      <AppHeader title="Município e bairros" onBack={() => router.back()} />
      <AppScreen scroll>
        <View style={cityStyles.section}>
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
              <AppText variant="sectionTitle">Por bairro</AppText>
              {query.data.neighborhoods.map((n) => (
                <View key={n.name} style={cityStyles.row}>
                  <AppText variant="label">{n.name}</AppText>
                  <AppText color="muted">
                    {n.occurrences} ocorrências · {n.resolved} concluídas ·{' '}
                    {n.actions} ações públicas
                  </AppText>
                </View>
              ))}
              <AppText color="muted">
                Os números representam as contribuições registradas na
                plataforma. Não são uma medição de todos os problemas ou
                moradores da cidade.
              </AppText>
            </>
          )}
        </View>
      </AppScreen>
    </AppScreen>
  );
}
