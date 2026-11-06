import { ScrollView, View, RefreshControl } from 'react-native';
import { router, useIsFocused } from 'expo-router';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppSelect } from '@/components/ui/AppSelect';
import { AppInput } from '@/components/ui/AppInput';
import { QueryState } from '@/features/city/CityUI';
import { useOfficialCalls, useOfficialFilters, useOfficialOverview, useSyncStatus } from '@/features/city/useOfficialCalls';
import { useFollowStore } from '@/stores/followStore';
import { useTerritoryStore } from '@/stores/territoryStore';
import { useTerritoryFilters } from '@/features/places/useTerritoryFilters';
import { PlaceSelector } from '@/features/places/PlaceSelector';
import { NearbyCalls } from '@/features/home/NearbyCalls';
import { TERRITORY_PERIOD_OPTIONS, TERRITORY_STATUS_OPTIONS } from '@/features/territory/selectors';
import { CitizenAction } from '@/features/city/CitizenAction';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { spacing, useTheme } from '@/theme';

export default function HomeScreen() {
  const active = useIsFocused();
  const { colors } = useTheme();
  const filters = useTerritoryFilters();
  const search = useDebouncedValue(filters.search, 300);
  const calls = useOfficialCalls({ ...filters.params, search: search.trim() || undefined, limit: 5 }, active && filters.hydrated, filters.cacheScope);
  const options = useOfficialFilters(active);
  const sync = useSyncStatus(active);
  const overview = useOfficialOverview(undefined, active && filters.period !== 'all');
  const saved = useFollowStore((s) => s.savedCalls);
  const savedReady = useFollowStore((s) => s.hydrated);
  const explore = (list = false) => {
    useTerritoryStore.getState().setIsListView(list);
    useTerritoryStore.getState().setLayers(['official']);
    router.push({ pathname: '/(tabs)/TerritoryScreen', params: { fromHome: String(Date.now()) } });
  };
  return <AppScreen>
    <AppHeader title="Sua região" context="Rio de Janeiro · RJ" />
    <ScrollView contentContainerStyle={{ padding: spacing.contentPadding, paddingBottom: 120, gap: spacing.xl }} refreshControl={<RefreshControl refreshing={calls.isRefetching} tintColor={colors.ink} onRefresh={() => { if (filters.hydrated) { void calls.refetch(); void sync.refetch(); } }} />}>
      <PlaceSelector prompt />
      <View style={{ gap: spacing.sm }}>
        <AppText variant="sectionTitle">{filters.selection.kind === 'radius' || filters.selection.kind === 'pending-current' ? 'Chamados no entorno' : filters.selection.kind === 'neighborhood' ? `Chamados em ${filters.selection.name}` : 'Chamados no Rio'}</AppText>
        <AppInput label="Buscar chamados" placeholder="Buscar serviço ou protocolo" value={filters.search} onChangeText={(value) => filters.setFilter('search', value)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
          <AppSelect compact defaultValue="all" label="Categoria do serviço" value={filters.serviceType} options={[{ value: 'all', label: 'Todos os serviços' }, ...(options.data?.tipos || []).map((t) => ({ value: t, label: t }))]} onChange={(v) => filters.setFilter('serviceType', v)} />
          <AppSelect compact defaultValue="all" label="Situação publicada" value={filters.status} options={TERRITORY_STATUS_OPTIONS} onChange={(v) => filters.setFilter('status', v)} />
          <AppSelect compact defaultValue="all" label="Período dos chamados" value={filters.period} options={TERRITORY_PERIOD_OPTIONS} onChange={(v) => filters.setFilter('period', v)} />
        </ScrollView>
        {filters.period !== 'all' && <AppText variant="caption" color="muted">Período relativo à maior data de abertura da base: {overview.data?.maxOpenedAt ? new Date(overview.data.maxOpenedAt).toLocaleDateString('pt-BR') : 'referência indisponível'}.</AppText>}
        <AppText variant="caption" color="muted">{sync.data?.lastSyncAt ? `Base importada em ${new Date(sync.data.lastSyncAt).toLocaleString('pt-BR')}` : 'Data de atualização da base indisponível'}. Exibindo até cinco chamados, dos mais recentes aos mais antigos.</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <AppButton title="Explorar no mapa" onPress={() => explore()} />
          <AppButton title="Ver lista" variant="secondary" onPress={() => explore(true)} />
        </View>
        <QueryState loading={calls.isLoading} error={calls.error} retry={calls.refetch} />
        {filters.selection.kind === 'pending-current' && <AppText color="muted">Aguardando nova captura de localização ou escolha de outro lugar.</AppText>}
        {calls.fetchStatus === 'paused' && <AppText color="muted">Sem conexão. Tente novamente quando a rede retornar.</AppText>}
        {calls.data && calls.data.calls.length === 0 && <View style={{ gap: spacing.sm }}>
          <AppText>Nenhum chamado encontrado neste recorte da base.</AppText>
          <AppText color="muted">Amplie o raio, altere os filtros ou consulte o bairro inteiro. Isso não significa ausência de chamados no 1746.</AppText>
        </View>}
        <NearbyCalls calls={calls.data?.calls || []} selection={filters.selection} />
      </View>
      {savedReady && saved.length > 0 && <View style={{ gap: spacing.md }}>
        <AppText variant="sectionTitle">Estou acompanhando</AppText>
        <AppText variant="caption" color="muted">Salvos neste aparelho · independente do entorno selecionado</AppText>
        <NearbyCalls calls={saved.slice(0, 2)} selection={{ kind: 'municipality' }} />
        <AppButton title="Ver meus salvos" variant="secondary" onPress={() => router.push('/(tabs)/FollowScreen')} />
      </View>}
      <CitizenAction title="Precisa solicitar um serviço?" description="Acesse o atendimento oficial da prefeitura" icon="open-outline" onPress={() => router.push('/(tabs)/ParticipateScreen')} />
    </ScrollView>
  </AppScreen>;
}
