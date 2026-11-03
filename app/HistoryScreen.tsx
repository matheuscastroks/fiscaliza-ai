import { useThemedStyles } from '@/theme/useTheme';
import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { OccurrenceRow } from '@/components/occurrences/OccurrenceRow';
import { QueryState, createCityStyles } from '@/features/city/CityUI';
import { useCityPages } from '@/features/city/useCityPages';
import { AppButton } from '@/components/ui/AppButton';
import { useAuthStore } from '@/stores/authStore';
import type { Occurrence } from '@/shared/contracts';
import { goBack } from '@/utils/navigation';
export default function HistoryScreen() {
  const cityStyles = useThemedStyles(createCityStyles);

  const user = useAuthStore((state) => state.user);
  const params = new URLSearchParams({ userId: user?.id || '', status: 'resolved', evaluated: 'true', order: 'evaluated' });
  const query = useCityPages<Occurrence>('/occurrences?' + params.toString(), Boolean(user?.id));
  const items = query.items;
  return (
    <AppScreen>
      <AppHeader title="Histórico de atendimentos" onBack={goBack} />
      <FlatList data={items} keyExtractor={item => item.id} initialNumToRender={8} maxToRenderPerBatch={8} windowSize={5} contentContainerStyle={cityStyles.content} ListHeaderComponent={<View style={cityStyles.section}>
        <QueryState
          loading={query.isLoading}
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
        {query.fetchStatus === 'paused' && <AppText color="muted">Sem conexão. Tente novamente quando a rede retornar.</AppText>}
        {!query.isPending && !query.error && query.fetchStatus !== 'paused' && !items.length && (
          <AppText color="muted">
            Seus atendimentos concluídos e avaliados aparecerão aqui.
          </AppText>
        )}
        </View>} renderItem={({ item }) => (
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
        )} ListFooterComponent={query.hasNextPage ? <AppButton title="Carregar mais" loading={query.isFetchingNextPage} onPress={() => { void query.fetchNextPage(); }} /> : null} />
    </AppScreen>
  );
}
