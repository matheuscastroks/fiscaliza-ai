import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { OccurrenceRow } from '@/components/occurrences/OccurrenceRow';
import { CivicRow, QueryState, cityStyles, kindLabel, statusLabel } from '@/features/city/CityUI';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { useCityQuery } from '@/features/city/useCityQuery';
import { inMapRegion } from '@/shared/territory';
import { civicLocation, civicTerritory, matchesNeighborhood, neighborhoodOptions, normalizeNeighborhood, occurrenceMatchesNeighborhood } from '@/shared/civic-territory';
import type { CivicItem, Occurrence } from '@/shared/contracts';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { useAuthStore } from '@/stores/authStore';
import { useTerritorySelection } from '@/stores/territoryStore';
import { municipalityRegion } from '@/features/city/municipalContext';

// Native maps are excluded from the web bundle.
let NativeMap: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const maps = require('react-native-maps');
  NativeMap = maps.default;
  Marker = maps.Marker;
}

type Kind = 'all' | 'occurrences' | CivicItem['kind'];
type Entry = { type: 'occurrence'; item: Occurrence } | { type: 'civic'; item: CivicItem };
const occurrenceStatus: Record<string, string> = { pending: 'Recebida', in_progress: 'Em atendimento', resolved: 'Concluída' };
const pinColors = { proposal: colors.attention, consultation: colors.muted, action: colors.completed };
const locatedOccurrence = (item: Occurrence) => Number.isFinite(item.location.latitude) && Number.isFinite(item.location.longitude) && Math.abs(item.location.latitude) <= 90 && Math.abs(item.location.longitude) <= 180 ? item.location : undefined;
const entryLocation = (entry: Entry) => entry.type === 'occurrence' ? locatedOccurrence(entry.item) : civicLocation(entry.item);

export default function TerritoryScreen() {
  const user = useAuthStore((state) => state.user);
  return <TerritoryContent key={user?.id + ':' + user?.municipality?.id} />;
}

function TerritoryContent() {
  const user = useAuthStore((state) => state.user);
  const municipality = user?.municipality;
  const initial = useMemo(() => municipalityRegion(municipality), [municipality]);
  const occurrences = useCityQuery<Occurrence[]>('/occurrences');
  const civic = useCityQuery<CivicItem[]>('/civic-items');
  const { neighborhood, setNeighborhood } = useTerritorySelection();
  const options = neighborhoodOptions(occurrences.data || [], civic.data || [], user?.neighborhood);
  const [region, setRegion] = useState(initial);
  const [areaOnly, setAreaOnly] = useState(false);
  const [kind, setKind] = useState<Kind>('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [map, setMap] = useState(Platform.OS !== 'web');
  const [locationMessage, setLocationMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const entries = useMemo(() => {
    const term = normalizeNeighborhood(search);
    const result: Entry[] = [];
    if (kind === 'all' || kind === 'occurrences') {
      for (const item of occurrences.data || []) {
        if (occurrenceMatchesNeighborhood(item, neighborhood) && (status === 'all' || item.status === status) && normalizeNeighborhood([item.title, item.description, item.location.address, item.location.neighborhood].join(' ')).includes(term)) result.push({ type: 'occurrence', item });
      }
    }
    if (kind !== 'occurrences') {
      for (const item of civic.data || []) {
        const territory = civicTerritory(item);
        const label = territory.scope === 'municipality' ? 'Todo o município' : territory.neighborhood;
        if ((kind === 'all' || item.kind === kind) && matchesNeighborhood(item, neighborhood) && (status === 'all' || item.status === status) && normalizeNeighborhood([item.title, item.summary, label, territory.scope === 'location' ? territory.location.address : ''].join(' ')).includes(term)) result.push({ type: 'civic', item });
      }
    }
    return result.sort((a, b) => {
      const aDate = a.type === 'occurrence' ? a.item.reportedAt : a.item.createdAt;
      const bDate = b.type === 'occurrence' ? b.item.reportedAt : b.item.createdAt;
      return bDate.localeCompare(aDate);
    });
  }, [occurrences.data, civic.data, kind, status, search, neighborhood]);
  const unlocated = entries.filter((entry) => !entryLocation(entry));
  const located = entries.filter((entry) => {
    const point = entryLocation(entry);
    return point && (!areaOnly || inMapRegion(point, region));
  });
  const listed = areaOnly ? located : entries;
  const counts = listed.reduce((result, entry) => {
    result[entry.type === 'occurrence' ? 'occurrences' : entry.item.kind]++;
    return result;
  }, { occurrences: 0, proposal: 0, consultation: 0, action: 0 });
  const statuses: [string, string][] = kind === 'occurrences'
    ? Object.entries(occurrenceStatus)
    : kind === 'proposal'
      ? ['submitted', 'under_review', 'accepted', 'declined'].map((key) => [key, statusLabel[key]])
      : kind === 'consultation'
        ? ['open', 'closed'].map((key) => [key, statusLabel[key]])
        : kind === 'action'
          ? ['planned', 'in_progress', 'completed'].map((key) => [key, statusLabel[key]])
          : [];
  const showOccurrences = kind === 'all' || kind === 'occurrences';
  const showCivic = kind !== 'occurrences';
  const dataReady = (!showOccurrences || occurrences.data !== undefined) && (!showCivic || civic.data !== undefined);
  const openEntry = (entry: Entry) => router.push({ pathname: entry.type === 'occurrence' ? '/ProblemDetailsScreen' : '/CivicDetailsScreen', params: { id: entry.item.id } });
  const renderEntry = (entry: Entry) => <View key={entry.type + entry.item.id}>
    {entry.type === 'occurrence' ? <OccurrenceRow problem={entry.item} onPress={() => openEntry(entry)} /> : <>
      {civicTerritory(entry.item).scope === 'municipality' && <AppText variant="caption" color="accent">Abrangência: todo o município</AppText>}
      <CivicRow item={entry.item} />
    </>}
  </View>;
  const resetFilters = () => { setSearch(''); setStatus('all'); setNeighborhood(''); setAreaOnly(false); };
  const locate = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationMessage('Localização não autorizada. Explore os bairros pelo mapa ou pela lista.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setRegion((current) => ({ ...current, latitude: location.coords.latitude, longitude: location.coords.longitude }));
      setLocationMessage('');
    } catch {
      setLocationMessage('Não foi possível obter sua posição. Tente novamente ou volte ao município.');
    } finally { setLocating(false); }
  };

  return <AppScreen>
    <AppHeader title="Território" context={municipality ? `${municipality.name} · ${municipality.state}` : 'Seu município'} />
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={cityStyles.content}>
      <AppInput label="Buscar rua, bairro ou assunto" value={search} onChangeText={setSearch} />
      <NeighborhoodPicker options={options} value={neighborhood} onChange={setNeighborhood} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
        {([['all', 'Tudo'], ['occurrences', 'Ocorrências'], ['proposal', 'Propostas'], ['consultation', 'Consultas'], ['action', 'Ações']] as const).map(([value, label]) => <AppButton key={value} title={label} variant={kind === value ? 'primary' : 'quiet'} accessibilityState={{ selected: kind === value }} onPress={() => { setKind(value); setStatus('all'); }} />)}
      </ScrollView>
      {statuses.length > 0 && <View style={cityStyles.controls}>
        {[['all', 'Todas'], ...statuses].map(([value, label]) => <AppButton key={value} title={label} variant={status === value ? 'secondary' : 'quiet'} accessibilityState={{ selected: status === value }} onPress={() => setStatus(value)} />)}
      </View>}
      {!municipality && <AppText color="muted">Confirme seu município no perfil para explorar o território.</AppText>}
      {showOccurrences && <View style={{ gap: spacing.xs }}>
        {occurrences.error && <AppText variant="label">Ocorrências</AppText>}
        <QueryState loading={occurrences.isLoading} error={occurrences.error} retry={occurrences.refetch} />
        {occurrences.fetchStatus === 'paused' && <AppText color="muted">Ocorrências aguardando conexão. Os dados já carregados continuam disponíveis.</AppText>}
      </View>}
      {showCivic && <View style={{ gap: spacing.xs }}>
        {civic.error && <AppText variant="label">Propostas, consultas e ações</AppText>}
        <QueryState loading={civic.isLoading} error={civic.error} retry={civic.refetch} />
        {civic.fetchStatus === 'paused' && <AppText color="muted">Participações aguardando conexão. Os dados já carregados continuam disponíveis.</AppText>}
      </View>}
      {dataReady && <AppText color="muted" accessibilityLiveRegion="polite">{neighborhood || 'Todo o município'}{areaOnly ? ' · área visível' : ''}: {counts.occurrences} ocorrências · {counts.proposal} propostas · {counts.consultation} consultas · {counts.action} ações.</AppText>}
      {Platform.OS !== 'web' && <View style={cityStyles.controls}>
        <AppButton title={map ? 'Ver lista' : 'Ver mapa'} variant="secondary" onPress={() => { setMap(!map); setAreaOnly(false); }} />
        <AppButton title="Minha posição" loading={locating} variant="quiet" onPress={() => { void locate(); }} />
        <AppButton title="Voltar ao município" variant="quiet" onPress={() => { setRegion(initial); setAreaOnly(false); }} />
      </View>}
      {locationMessage !== '' && <AppText color="muted" accessibilityLiveRegion="polite">{locationMessage}</AppText>}
      {map && NativeMap && <>
        <NativeMap style={{ height: 320, width: '100%' }} region={region} onRegionChangeComplete={setRegion}>
          {located.map((entry) => <Marker key={entry.type + entry.item.id} coordinate={entryLocation(entry)} title={`${entry.type === 'occurrence' ? 'Ocorrência' : kindLabel[entry.item.kind]} · ${entry.item.title}`} description={entry.type === 'occurrence' ? `${occurrenceStatus[entry.item.status]} · ${entry.item.location.address}` : `${statusLabel[entry.item.status]} · ${entry.item.neighborhood}`} pinColor={entry.type === 'occurrence' ? colors.accent : pinColors[entry.item.kind]} onCalloutPress={() => openEntry(entry)} />)}
        </NativeMap>
        <AppText variant="caption" color="muted">Azul: ocorrência · ocre: proposta · cinza: consulta · verde: ação. Toque no marcador para identificar o item.</AppText>
        <AppButton title={areaOnly ? 'Mostrar todo o recorte' : 'Buscar nesta área'} variant="secondary" onPress={() => setAreaOnly(!areaOnly)} />
        <AppText color="muted">{located.length} itens com ponto no mapa. {unlocated.length} itens sem ponto específico continuam na lista.</AppText>
      </>}
      <View style={cityStyles.section}>
        <AppText variant="sectionTitle">{areaOnly ? 'Itens na área visível' : 'Lista do território'}</AppText>
        {listed.map(renderEntry)}
        {dataReady && listed.length === 0 && <>
          <AppText color="muted">Nenhum item corresponde a este recorte. Altere o bairro, a busca ou a situação.</AppText>
          <AppButton title="Limpar filtros" variant="secondary" onPress={resetFilters} />
        </>}
      </View>
      {areaOnly && unlocated.length > 0 && <View style={cityStyles.section}>
        <AppText variant="sectionTitle">Sem ponto específico · {unlocated.length}</AppText>
        <AppText color="muted">Abrangem o município ou um bairro, sem localização para comparar com a área do mapa.</AppText>
        {unlocated.map(renderEntry)}
      </View>}
      <AppButton title="Registrar ocorrência" onPress={() => router.push('/(tabs)/ReportScreen')} />
    </ScrollView>
  </AppScreen>;
}
