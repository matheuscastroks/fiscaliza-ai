import { Ionicons } from '@expo/vector-icons';
import { layout } from '@/theme/layout';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { OccurrenceRow } from '@/components/occurrences/OccurrenceRow';
import {
  CivicRow,
  QueryState,
  cityStyles,
  kindLabel,
  statusLabel,
} from '@/features/city/CityUI';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { useCityQuery } from '@/features/city/useCityQuery';
import { inMapRegion } from '@/shared/territory';
import {
  civicLocation,
  civicTerritory,
  matchesNeighborhood,
  neighborhoodOptions,
  normalizeNeighborhood,
  occurrenceMatchesNeighborhood,
} from '@/shared/civic-territory';
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
type Entry =
  | { type: 'occurrence'; item: Occurrence }
  | { type: 'civic'; item: CivicItem };
const occurrenceStatus: Record<string, string> = {
  pending: 'Recebida',
  in_progress: 'Em atendimento',
  resolved: 'Concluída',
};
const pinColors = {
  proposal: colors.attention,
  consultation: colors.muted,
  action: colors.completed,
};
const locatedOccurrence = (item: Occurrence) =>
  Number.isFinite(item.location.latitude) &&
  Number.isFinite(item.location.longitude) &&
  Math.abs(item.location.latitude) <= 90 &&
  Math.abs(item.location.longitude) <= 180
    ? item.location
    : undefined;
const entryLocation = (entry: Entry) =>
  entry.type === 'occurrence'
    ? locatedOccurrence(entry.item)
    : civicLocation(entry.item);

export default function TerritoryScreen() {
  const user = useAuthStore((state) => state.user);
  return <TerritoryContent key={user?.id + ':' + user?.municipality?.id} />;
}

function TerritoryContent() {
  const user = useAuthStore((state) => state.user);
  const municipality = user?.municipality;
  const initial = useMemo(
    () => municipalityRegion(municipality),
    [municipality],
  );
  const occurrences = useCityQuery<Occurrence[]>('/occurrences');
  const civic = useCityQuery<CivicItem[]>('/civic-items');
  const { neighborhood, setNeighborhood } = useTerritorySelection();
  const options = neighborhoodOptions(
    occurrences.data || [],
    civic.data || [],
    user?.neighborhood,
  );
  const [region, setRegion] = useState(initial);
  const [areaOnly, setAreaOnly] = useState(false);
  const [kind, setKind] = useState<Kind>('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [map, setMap] = useState(Platform.OS !== 'web');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showUnlocated, setShowUnlocated] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const entries = useMemo(() => {
    const term = normalizeNeighborhood(search);
    const result: Entry[] = [];
    if (kind === 'all' || kind === 'occurrences') {
      for (const item of occurrences.data || []) {
        if (
          occurrenceMatchesNeighborhood(item, neighborhood) &&
          (status === 'all' || item.status === status) &&
          normalizeNeighborhood(
            [
              item.title,
              item.description,
              item.location.address,
              item.location.neighborhood,
            ].join(' '),
          ).includes(term)
        )
          result.push({ type: 'occurrence', item });
      }
    }
    if (kind !== 'occurrences') {
      for (const item of civic.data || []) {
        const territory = civicTerritory(item);
        const label =
          territory.scope === 'municipality'
            ? 'Todo o município'
            : territory.neighborhood;
        if (
          (kind === 'all' || item.kind === kind) &&
          matchesNeighborhood(item, neighborhood) &&
          (status === 'all' || item.status === status) &&
          normalizeNeighborhood(
            [
              item.title,
              item.summary,
              label,
              territory.scope === 'location' ? territory.location.address : '',
            ].join(' '),
          ).includes(term)
        )
          result.push({ type: 'civic', item });
      }
    }
    return result.sort((a, b) => {
      const aDate =
        a.type === 'occurrence' ? a.item.reportedAt : a.item.createdAt;
      const bDate =
        b.type === 'occurrence' ? b.item.reportedAt : b.item.createdAt;
      return bDate.localeCompare(aDate);
    });
  }, [occurrences.data, civic.data, kind, status, search, neighborhood]);
  const unlocated = entries.filter((entry) => !entryLocation(entry));
  const located = entries.filter((entry) => {
    const point = entryLocation(entry);
    return point && (!areaOnly || inMapRegion(point, region));
  });
  const listed = areaOnly ? located : entries;
  const selectedEntry = located.find((entry) => entry.item.id === selectedId);
  const filterCount =
    Number(Boolean(neighborhood)) + Number(status !== 'all') + Number(areaOnly);
  const statuses: [string, string][] =
    kind === 'occurrences'
      ? Object.entries(occurrenceStatus)
      : kind === 'proposal'
        ? ['submitted', 'under_review', 'accepted', 'declined'].map((key) => [
            key,
            statusLabel[key],
          ])
        : kind === 'consultation'
          ? ['open', 'closed'].map((key) => [key, statusLabel[key]])
          : kind === 'action'
            ? ['planned', 'in_progress', 'completed'].map((key) => [
                key,
                statusLabel[key],
              ])
            : [];
  const showOccurrences = kind === 'all' || kind === 'occurrences';
  const showCivic = kind !== 'occurrences';
  const dataReady =
    (!showOccurrences || occurrences.data !== undefined) &&
    (!showCivic || civic.data !== undefined);
  const openEntry = (entry: Entry) =>
    router.push({
      pathname:
        entry.type === 'occurrence'
          ? '/ProblemDetailsScreen'
          : '/CivicDetailsScreen',
      params: { id: entry.item.id },
    });
  const renderEntry = (entry: Entry) => (
    <View key={entry.type + entry.item.id}>
      {entry.type === 'occurrence' ? (
        <OccurrenceRow problem={entry.item} onPress={() => openEntry(entry)} />
      ) : (
        <>
          {civicTerritory(entry.item).scope === 'municipality' && (
            <AppText variant="caption" color="accent">
              Abrangência: todo o município
            </AppText>
          )}
          <CivicRow item={entry.item} />
        </>
      )}
    </View>
  );
  const resetFilters = () => {
    setSearch('');
    setKind('all');
    setSelectedId(null);
    setStatus('all');
    setNeighborhood('');
    setAreaOnly(false);
  };
  const locate = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationMessage(
          'Localização não autorizada. Explore os bairros pelo mapa ou pela lista.',
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setRegion((current) => ({
        ...current,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));
      setLocationMessage('');
    } catch {
      setLocationMessage(
        'Não foi possível obter sua posição. Tente novamente ou volte ao município.',
      );
    } finally {
      setLocating(false);
    }
  };

  return (
    <AppScreen>
      <AppHeader
        title="Território"
        context={
          municipality
            ? `${municipality.name} · ${municipality.state}`
            : 'Seu município'
        }
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={cityStyles.content}
      >
        <AppInput
          label="Buscar no território"
          placeholder="Rua, bairro ou assunto"
          value={search}
          onChangeText={setSearch}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -spacing.contentPadding }}
          contentContainerStyle={{
            gap: spacing.xs,
            paddingHorizontal: spacing.contentPadding,
          }}
        >
          {(
            [
              ['all', 'Tudo'],
              ['occurrences', 'Ocorrências'],
              ['proposal', 'Propostas'],
              ['consultation', 'Consultas'],
              ['action', 'Ações'],
            ] as const
          ).map(([value, label]) => (
            <AppButton
              key={value}
              title={label}
              variant={kind === value ? 'primary' : 'quiet'}
              accessibilityState={{ selected: kind === value }}
              onPress={() => {
                setKind(value);
                setStatus('all');
                setSelectedId(null);
                setAreaOnly(false);
              }}
            />
          ))}
        </ScrollView>
        <View style={styles.toolbar}>
          <View style={styles.flex}>
            <AppText variant="label">
              {neighborhood || 'Todo o município'}
            </AppText>
            {dataReady && (
              <AppText
                variant="meta"
                color="muted"
                accessibilityLiveRegion="polite"
              >
                {listed.length}{' '}
                {listed.length === 1 ? 'resultado' : 'resultados'}
                {areaOnly ? ' na área visível' : ''}
              </AppText>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtros do território"
            accessibilityState={{ expanded: filtersOpen }}
            aria-expanded={filtersOpen}
            onPress={() => setFiltersOpen(!filtersOpen)}
            style={[styles.filterButton, filtersOpen && styles.filterSelected]}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={filtersOpen ? colors.white : colors.ink}
            />
            <AppText variant="label" color={filtersOpen ? 'white' : 'ink'}>
              Filtros{filterCount ? ' · ' + filterCount : ''}
            </AppText>
          </Pressable>
        </View>
        {filtersOpen && (
          <View style={styles.filters}>
            <AppText variant="label">Bairro</AppText>
            <NeighborhoodPicker
              options={options}
              value={neighborhood}
              onChange={(value) => {
                setNeighborhood(value);
                setAreaOnly(false);
                setSelectedId(null);
              }}
            />
            {statuses.length > 0 && (
              <>
                <AppText variant="label">Situação</AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginHorizontal: -spacing.contentPadding }}
                  contentContainerStyle={{
                    gap: spacing.xs,
                    paddingHorizontal: spacing.contentPadding,
                  }}
                >
                  {[['all', 'Todas'], ...statuses].map(([value, label]) => (
                    <AppButton
                      key={value}
                      title={label}
                      variant={status === value ? 'primary' : 'quiet'}
                      accessibilityState={{ selected: status === value }}
                      onPress={() => setStatus(value)}
                    />
                  ))}
                </ScrollView>
              </>
            )}
            <AppButton
              title="Limpar filtros"
              variant="quiet"
              onPress={resetFilters}
            />
          </View>
        )}
        {Platform.OS !== 'web' && (
          <View style={styles.viewToggle} accessibilityRole="tablist">
            {(
              [
                ['map', 'Mapa', 'map-outline'],
                ['list', 'Lista', 'list-outline'],
              ] as const
            ).map(([value, label, icon]) => (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected: (value === 'map') === map }}
                onPress={() => {
                  setMap(value === 'map');
                  setAreaOnly(false);
                }}
                style={[
                  styles.viewTab,
                  (value === 'map') === map && styles.viewSelected,
                ]}
              >
                <Ionicons
                  name={icon}
                  size={20}
                  color={(value === 'map') === map ? colors.white : colors.ink}
                />
                <AppText
                  variant="label"
                  color={(value === 'map') === map ? 'white' : 'ink'}
                >
                  {label}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}
        {!municipality && (
          <AppText color="muted">
            Confirme seu município no perfil para explorar o território.
          </AppText>
        )}
        {showOccurrences &&
          (occurrences.isLoading ||
            occurrences.error ||
            occurrences.fetchStatus === 'paused') && (
            <View style={{ gap: spacing.xs }}>
              {occurrences.error && (
                <AppText variant="label">Ocorrências</AppText>
              )}
              <QueryState
                loading={occurrences.isLoading}
                error={occurrences.error}
                retry={occurrences.refetch}
              />
              {occurrences.fetchStatus === 'paused' && (
                <AppText color="muted">
                  Ocorrências aguardando conexão. Os dados já carregados
                  continuam disponíveis.
                </AppText>
              )}
            </View>
          )}
        {showCivic &&
          (civic.isLoading ||
            civic.error ||
            civic.fetchStatus === 'paused') && (
            <View style={{ gap: spacing.xs }}>
              {civic.error && (
                <AppText variant="label">Propostas, consultas e ações</AppText>
              )}
              <QueryState
                loading={civic.isLoading}
                error={civic.error}
                retry={civic.refetch}
              />
              {civic.fetchStatus === 'paused' && (
                <AppText color="muted">
                  Participações aguardando conexão. Os dados já carregados
                  continuam disponíveis.
                </AppText>
              )}
            </View>
          )}
        {locationMessage !== '' && (
          <AppText color="muted" accessibilityLiveRegion="polite">
            {locationMessage}
          </AppText>
        )}
        {map && NativeMap && (
          <View style={cityStyles.section}>
            <View style={styles.mapFrame}>
              <NativeMap
                style={styles.map}
                region={region}
                onRegionChangeComplete={setRegion}
              >
                {located.map((entry) => (
                  <Marker
                    key={entry.type + entry.item.id}
                    coordinate={entryLocation(entry)}
                    title={`${entry.type === 'occurrence' ? 'Ocorrência' : kindLabel[entry.item.kind]} · ${entry.item.title}`}
                    description={
                      entry.type === 'occurrence'
                        ? `${occurrenceStatus[entry.item.status]} · ${entry.item.location.address}`
                        : `${statusLabel[entry.item.status]} · ${entry.item.neighborhood}`
                    }
                    pinColor={
                      entry.type === 'occurrence'
                        ? colors.accent
                        : pinColors[entry.item.kind]
                    }
                    onPress={() => setSelectedId(entry.item.id)}
                    onCalloutPress={() => openEntry(entry)}
                  />
                ))}
              </NativeMap>
              <View style={styles.mapActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Minha posição"
                  accessibilityState={{ disabled: locating, busy: locating }}
                  disabled={locating}
                  onPress={() => {
                    void locate();
                  }}
                  style={styles.mapCircle}
                >
                  <Ionicons
                    name="locate-outline"
                    size={22}
                    color={colors.ink}
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Voltar ao município"
                  onPress={() => {
                    setRegion(initial);
                    setAreaOnly(false);
                    setSelectedId(null);
                  }}
                  style={styles.mapCircle}
                >
                  <Ionicons
                    name="expand-outline"
                    size={22}
                    color={colors.ink}
                  />
                </Pressable>
              </View>
            </View>
            <AppButton
              title={
                areaOnly ? 'Mostrar todo o território' : 'Buscar nesta área'
              }
              variant="secondary"
              onPress={() => setAreaOnly(!areaOnly)}
            />
            {selectedEntry ? (
              renderEntry(selectedEntry)
            ) : (
              <AppText variant="meta" color="muted">
                Toque em um ponto para ver o registro.
              </AppText>
            )}
            {unlocated.length > 0 && (
              <AppButton
                title={
                  (showUnlocated ? 'Ocultar' : 'Ver') +
                  ' participações sem ponto no mapa · ' +
                  unlocated.length
                }
                variant="quiet"
                onPress={() => setShowUnlocated(!showUnlocated)}
              />
            )}
          </View>
        )}
        {!map && (
          <View style={cityStyles.section}>
            <AppText variant="sectionTitle">
              {areaOnly ? 'Itens na área visível' : 'Lista do território'}
            </AppText>
            {listed.map(renderEntry)}
            {dataReady && listed.length === 0 && (
              <>
                <AppText color="muted">Nenhum resultado neste recorte.</AppText>
                <AppButton
                  title="Limpar filtros"
                  variant="secondary"
                  onPress={resetFilters}
                />
              </>
            )}
          </View>
        )}
        {map && showUnlocated && unlocated.length > 0 && (
          <View style={cityStyles.section}>
            <AppText variant="sectionTitle">
              Sem ponto específico · {unlocated.length}
            </AppText>
            <AppText color="muted">
              Abrangem o município ou um bairro, sem localização para comparar
              com a área do mapa.
            </AppText>
            {unlocated.map(renderEntry)}
          </View>
        )}
        <AppButton
          title="Participar da cidade"
          onPress={() => router.push('/(tabs)/ParticipateScreen')}
        />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1, gap: spacing.xxs },
  filterButton: {
    minHeight: layout.touchTarget.minHeight,
    paddingHorizontal: spacing.md,
    borderRadius: layout.radius.pill,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  filterSelected: { backgroundColor: colors.ink },
  filters: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: layout.radius.card,
    backgroundColor: colors.surface,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: layout.radius.pill,
    padding: spacing.xxs,
  },
  viewTab: {
    flex: 1,
    minHeight: layout.touchTarget.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: layout.radius.pill,
  },
  viewSelected: { backgroundColor: colors.ink },
  mapFrame: {
    borderRadius: layout.radius.card,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surfaceSubdued,
  },
  map: { height: 360, width: '100%' },
  mapActions: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    gap: spacing.xs,
  },
  mapCircle: {
    width: layout.touchTarget.minWidth,
    height: layout.touchTarget.minHeight,
    borderRadius: layout.radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
