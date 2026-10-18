import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { OccurrenceRow } from '@/components/occurrences/OccurrenceRow';
import { CivicRow, QueryState, cityStyles } from '@/features/city/CityUI';
import { useCityQuery } from '@/features/city/useCityQuery';
import type { CivicItem, Occurrence } from '@/shared/contracts';
import { useAuthStore } from '@/stores/authStore';
export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const civic = useCityQuery<CivicItem[]>('/civic-items');
  const activity = useCityQuery<{
    occurrences: Occurrence[];
    items: CivicItem[];
  }>('/activity');
  const consultations =
    civic.data?.filter(
      (i) => i.kind === 'consultation' && i.status === 'open',
    ) || [];
  const actions = civic.data?.filter((i) => i.kind === 'action') || [];
  const localActivity =
    activity.data?.occurrences.filter(
      (item) => item.municipalityId === user?.municipality?.id,
    ) || [];
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
          <AppText variant="screenTitle">
            Olá, {user?.name.split(' ')[0] || 'vizinho'}.
          </AppText>
          <AppText color="muted">O que está acontecendo no seu bairro?</AppText>
          <AppButton
            title="Explorar o território"
            onPress={() => router.push('/(tabs)/TerritoryScreen')}
          />
        </View>
        <QueryState
          loading={civic.isPending}
          error={civic.error}
          retry={civic.refetch}
        />
        <View>
          <AppText variant="sectionTitle">Sua participação</AppText>
          <QueryState
            loading={activity.isPending}
            error={activity.error}
            retry={activity.refetch}
          />
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
              Seus registros e acompanhamentos aparecerão aqui.
            </AppText>
          )}
          <AppButton
            title="Ver meus acompanhamentos"
            variant="quiet"
            onPress={() => router.push('/(tabs)/FollowScreen')}
          />
        </View>
        <View>
          <AppText variant="sectionTitle">
            Decisões abertas à participação
          </AppText>
          {consultations.map((i) => (
            <CivicRow key={i.id} item={i} />
          ))}
          {civic.data && !consultations.length && (
            <AppText color="muted">Nenhuma consulta aberta agora.</AppText>
          )}
        </View>
        <View>
          <AppText variant="sectionTitle">Ações no território</AppText>
          {actions.slice(0, 3).map((i) => (
            <CivicRow key={i.id} item={i} />
          ))}
        </View>
        <AppButton
          title="Conhecer os resultados"
          variant="secondary"
          onPress={() => router.push('/ResultsScreen')}
        />
      </ScrollView>
    </AppScreen>
  );
}
