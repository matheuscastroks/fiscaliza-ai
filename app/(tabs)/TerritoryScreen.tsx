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
import { CivicRow, QueryState, cityStyles } from '@/features/city/CityUI';
import { useCityQuery } from '@/features/city/useCityQuery';
import { inMapRegion } from '@/shared/territory';
import type { CivicItem, Occurrence } from '@/shared/contracts';
import { colors } from '@/theme/colors';
import { useAuthStore } from '@/stores/authStore';
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
export default function TerritoryScreen() {
  const municipalityId = useAuthStore((state) => state.user?.municipality?.id);
  return <TerritoryContent key={municipalityId || 'pending'} />;
}
function TerritoryContent() {
  const municipality = useAuthStore((state) => state.user?.municipality);
  const initial = useMemo(
    () => municipalityRegion(municipality),
    [municipality],
  );
  const occurrences = useCityQuery<Occurrence[]>('/occurrences');
  const civic = useCityQuery<CivicItem[]>('/civic-items');
  const [region, setRegion] = useState(initial);
  const [areaOnly, setAreaOnly] = useState(false);
  const [kind, setKind] = useState<
    'occurrences' | 'proposal' | 'consultation' | 'action'
  >('occurrences');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [map, setMap] = useState(Platform.OS !== 'web');
  const [locationMessage, setLocationMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const filtered = useMemo(
    () =>
      (occurrences.data || []).filter(
        (p) =>
          (status === 'all' || p.status === status) &&
          (p.title + ' ' + p.location.address)
            .toLocaleLowerCase('pt-BR')
            .includes(search.toLocaleLowerCase('pt-BR')) &&
          (!areaOnly || inMapRegion(p.location, region)),
      ),
    [occurrences.data, status, search, areaOnly, region],
  );
  const locate = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationMessage(
          'Localização não autorizada. Você pode explorar os bairros pelo mapa ou pela lista.',
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setRegion({
        ...region,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
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
      <ScrollView contentContainerStyle={cityStyles.content}>
        <AppInput
          label="Buscar rua, bairro ou assunto"
          value={search}
          onChangeText={setSearch}
        />
        <View style={cityStyles.controls}>
          {(
            [
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
              onPress={() => setKind(value)}
            />
          ))}
        </View>
        {kind === 'occurrences' ? (
          <>
            <View style={cityStyles.controls}>
              {(
                [
                  ['all', 'Todas'],
                  ['pending', 'Recebidas'],
                  ['in_progress', 'Em atendimento'],
                  ['resolved', 'Concluídas'],
                ] as const
              ).map(([value, label]) => (
                <AppButton
                  key={value}
                  title={label}
                  variant={status === value ? 'secondary' : 'quiet'}
                  onPress={() => setStatus(value)}
                />
              ))}
            </View>
            <QueryState
              loading={occurrences.isPending}
              error={occurrences.error}
              retry={occurrences.refetch}
            />
            {Platform.OS !== 'web' && (
              <View style={cityStyles.controls}>
                <AppButton
                  title={map ? 'Ver lista' : 'Ver mapa'}
                  variant="secondary"
                  onPress={() => setMap(!map)}
                />
                <AppButton
                  title="Minha posição"
                  loading={locating}
                  variant="quiet"
                  onPress={() => {
                    void locate();
                  }}
                />
                <AppButton
                  title="Voltar ao município"
                  variant="quiet"
                  onPress={() => {
                    setRegion(initial);
                    setAreaOnly(false);
                  }}
                />
              </View>
            )}
            {locationMessage !== '' && (
              <AppText color="muted" accessibilityLiveRegion="polite">
                {locationMessage}
              </AppText>
            )}
            {map && NativeMap && (
              <>
                <NativeMap
                  style={{ height: 320, width: '100%' }}
                  region={region}
                  onRegionChangeComplete={setRegion}
                >
                  {filtered.map((p) => (
                    <Marker
                      key={p.id}
                      coordinate={p.location}
                      title={p.title}
                      description={p.location.address}
                      pinColor={
                        p.status === 'resolved'
                          ? colors.completed
                          : colors.accent
                      }
                      onCalloutPress={() =>
                        router.push({
                          pathname: '/ProblemDetailsScreen',
                          params: { id: p.id },
                        })
                      }
                    />
                  ))}
                </NativeMap>
                <AppButton
                  title={
                    areaOnly ? 'Mostrar todo o município' : 'Buscar nesta área'
                  }
                  variant="secondary"
                  onPress={() => setAreaOnly(!areaOnly)}
                />
              </>
            )}
            <AppText color="muted">
              {filtered.length} ocorrências{' '}
              {areaOnly ? 'na área visível' : 'no município'}
            </AppText>
            {filtered.map((p) => (
              <OccurrenceRow
                key={p.id}
                problem={p}
                onPress={() =>
                  router.push({
                    pathname: '/ProblemDetailsScreen',
                    params: { id: p.id },
                  })
                }
              />
            ))}
            {occurrences.data && !filtered.length && (
              <AppText color="muted">
                Nenhuma ocorrência neste filtro. Tente outra área ou remova os
                filtros.
              </AppText>
            )}
            <AppButton
              title="Registrar ocorrência"
              onPress={() => router.push('/(tabs)/ReportScreen')}
            />
          </>
        ) : (
          <>
            <QueryState
              loading={civic.isPending}
              error={civic.error}
              retry={civic.refetch}
            />
            {civic.data
              ?.filter(
                (i) =>
                  i.kind === kind &&
                  (i.title + ' ' + i.neighborhood)
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              )
              .map((i) => (
                <CivicRow key={i.id} item={i} />
              ))}
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}
