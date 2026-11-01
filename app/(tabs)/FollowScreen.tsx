import { FlatList, View, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { SlidingTabs } from '@/components/ui/SlidingTabs';
import { OfficialCallRow } from '@/components/official/OfficialCallRow';
import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';
import { useAuthStore } from '@/stores/authStore';
import { useFollowStore, type FollowStatusFilter } from '@/stores/followStore';
import { useSavedRefresh } from '@/features/city/useSavedRefresh';
import { useTheme, spacing } from '@/theme';
import { isOfficialCallClosed } from '@/shared/official-call-state';

export default function FollowScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const {
    savedCalls,
    hydrated,
    persistenceError,
    statusFilter,
    setStatusFilter,
    metadata,
  } = useFollowStore();
  const { refresh, refreshing, error } = useSavedRefresh();
  const calls = savedCalls.filter(
    (c) =>
      statusFilter === 'all' ||
      statusFilter === 'saved' ||
      (statusFilter === 'resolved'
        ? isOfficialCallClosed(c)
        : !isOfficialCallClosed(c)),
  );
  return (
    <AppScreen>
      <AppHeader
        title="Acompanhar"
        context={
          user?.name
            ? `Conta de ${user.name.split(' ')[0]} · Chamados salvos`
            : 'Chamados salvos na sua conta'
        }
      />
      <FlatList
        data={hydrated ? calls : []}
        keyExtractor={(c) => c.id}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        contentContainerStyle={{
          padding: spacing.contentPadding,
          paddingBottom: 120,
          gap: spacing.md,
          flexGrow: 1,
        }}
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
        ListHeaderComponent={
          <View style={{ gap: spacing.md }}>
            <SlidingTabs
              label="Filtrar meus salvos"
              value={statusFilter === 'saved' ? 'all' : statusFilter}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'open', label: 'Em aberto' },
                { value: 'resolved', label: 'Encerrados no 1746' },
              ]}
              onChange={(v) => setStatusFilter(v as FollowStatusFilter)}
            />
            <AppText variant="caption" color="muted">
              Arraste para consultar atualizações. Encerramento no 1746 não
              confirma a resolução no local.
            </AppText>
            {!hydrated && (
              <AppText color="muted">Carregando seus salvos…</AppText>
            )}
            {(persistenceError || error) && (
              <AppText color="risk" accessibilityRole="alert">
                {persistenceError || error}
              </AppText>
            )}
          </View>
        }
        ListEmptyComponent={
          hydrated ? (
            <IllustratedEmptyState
              kind="territory"
              title={
                savedCalls.length
                  ? 'Nenhum salvo neste filtro'
                  : 'Acompanhe o que importa para você'
              }
              description={
                savedCalls.length
                  ? 'Escolha Todos para consultar seus outros chamados.'
                  : 'Selecione chamados de seu interesse no mapa ou na lista e salve na sua conta para acompanhar atualizações do 1746.'
              }
              action={{
                title: savedCalls.length
                  ? 'Ver todos os salvos'
                  : 'Explorar demandas',
                onPress: () =>
                  savedCalls.length
                    ? setStatusFilter('all')
                    : router.push('/(tabs)/TerritoryScreen'),
              }}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={{ gap: spacing.xxs }}>
            <OfficialCallRow
              call={item}
              onPress={() =>
                router.push({
                  pathname: '/OfficialCallDetailsScreen',
                  params: { id: item.id },
                })
              }
            />
            <AppText variant="caption" color="muted">
              Última consulta:{' '}
              {metadata[item.id]?.checkedAt
                ? new Date(metadata[item.id].checkedAt).toLocaleString('pt-BR')
                : 'não disponível'}
            </AppText>
          </View>
        )}
      />
    </AppScreen>
  );
}
