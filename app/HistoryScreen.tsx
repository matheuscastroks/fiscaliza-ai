import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { OccurrenceRow } from '@/components/occurrences/OccurrenceRow';
import { QueryState, cityStyles } from '@/features/city/CityUI';
import { useCityQuery } from '@/features/city/useCityQuery';
import { useAuthStore } from '@/stores/authStore';
import type { Occurrence } from '@/shared/contracts';
import { goBack } from '@/utils/navigation';
export default function HistoryScreen() {
  const user = useAuthStore((state) => state.user);
  const query = useCityQuery<Occurrence[]>('/occurrences');
  const items = (query.data || [])
    .filter(
      (item) =>
        item.reportedBy === user?.id &&
        item.status === 'resolved' &&
        item.evaluation,
    )
    .sort(
      (a, b) =>
        new Date(b.evaluation!.at).getTime() -
        new Date(a.evaluation!.at).getTime(),
    );
  return (
    <AppScreen>
      <AppHeader title="Histórico de atendimentos" onBack={goBack} />
      <ScrollView contentContainerStyle={cityStyles.content}>
        <QueryState
          loading={query.isLoading}
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
        {query.data && !items.length && (
          <AppText color="muted">
            Seus atendimentos concluídos e avaliados aparecerão aqui.
          </AppText>
        )}
        {items.map((item) => (
          <View key={item.id} style={cityStyles.section}>
            <AppText variant="label">
              {item.evaluation?.rating
                ? item.evaluation.rating + ' de 5 estrelas'
                : 'Avaliação registrada'}
            </AppText>
            <OccurrenceRow
              problem={item}
              onPress={() =>
                router.push({
                  pathname: '/ProblemDetailsScreen',
                  params: { id: item.id },
                })
              }
            />
          </View>
        ))}
      </ScrollView>
    </AppScreen>
  );
}
