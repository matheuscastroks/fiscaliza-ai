import { View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppSelect } from '@/components/ui/AppSelect';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { usePlacesStore } from '@/stores/placesStore';
import { useDeviceLocation } from './useDeviceLocation';
import { RadiusControl } from './RadiusControl';
import { LocationEntryPrompt } from './LocationEntryPrompt';
import { spacing } from '@/theme';
import type { TerritorySelection } from './types';
export function PlaceSelector({ prompt = false }: { prompt?: boolean }) {
  const state = usePlacesStore();
  const { selection, places, setRadius } = state;
  const device = useDeviceLocation();
  const [expandedSelection, setExpandedSelection] = useState<TerritorySelection | null>(null);
  const expanded = expandedSelection === selection;
  const setExpanded = (value: boolean) => setExpandedSelection(value ? selection : null);
  if (!state.hydrated) return <AppText color="muted">Carregando seus lugares…</AppText>;
  const activePlace = selection.kind === 'radius' && selection.source === 'place' ? places.find((p) => p.id === selection.placeId) : undefined;
  const title = selection.kind === 'pending-current' ? 'Localização atual' : selection.kind === 'radius' ? activePlace?.name || 'Localização capturada' : selection.kind === 'neighborhood' ? selection.name : 'Rio de Janeiro';
  return <View style={{ gap: spacing.sm }}>
    {prompt && <LocationEntryPrompt busy={device.busy} onChoose={() => setExpanded(true)} onLocate={() => { void device.captureLocation(); }} />}
    <AppText variant="sectionTitle">{title}</AppText>
    {selection.kind === 'pending-current' && <>
      <AppText color="muted">Atualize a localização para retomar a consulta do entorno. Sua posição anterior não foi guardada.</AppText>
      <AppButton title="Atualizar localização" loading={device.busy} onPress={() => { void device.captureLocation(); }} />
    </>}
    <AppButton title={expanded ? 'Fechar escolha de lugar' : 'Trocar lugar ou bairro'} variant="secondary" onPress={() => setExpanded(!expanded)} />
    {selection.kind === 'radius' && <>
      <AppText color="muted">{selection.neighborhood?.name || 'Bairro não identificado'} · distância em linha reta</AppText>
      <RadiusControl value={selection.radiusMeters} onChange={(radius) => { void setRadius(radius); }} />
      {selection.source === 'current' && <AppText variant="caption" color="muted">
        Capturada às {new Date(selection.capturedAt || 0).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
        {selection.accuracyMeters != null ? ` Precisão aproximada: ${Math.round(selection.accuracyMeters)} m.` : ' Precisão não informada.'}
        {selection.accuracyMeters != null && selection.accuracyMeters > selection.radiusMeters ? ' A precisão excede o raio; amplie o entorno ou confirme outro ponto.' : ''}
      </AppText>}
      {expanded && selection.neighborhood && <AppButton title="Consultar bairro inteiro" variant="secondary" onPress={() => { if (selection.neighborhood) void state.selectNeighborhood(selection.neighborhood.name, selection.neighborhood.id); }} />}
    </>}
    {expanded && places.length > 0 && <AppSelect clearable={false} label="Lugares salvos" value={activePlace?.id || ''} options={[{ value: '', label: 'Escolher lugar salvo' }, ...places.map((p) => ({ value: p.id, label: p.name }))]} onChange={(id) => { if (id) void state.selectPlace(id); }} />}
    {expanded && <NeighborhoodPicker options={[]} value={selection.kind === 'neighborhood' ? selection.name : ''} onChange={(name) => { void state.dismissPrompt(); void state.selectNeighborhood(name); }} />}
    {expanded && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
      <AppButton title={selection.kind === 'radius' && selection.source === 'current' ? 'Atualizar localização' : 'Usar localização'} variant="secondary" loading={device.busy} onPress={() => { void device.captureLocation(); }} />
      <AppButton title="Meus lugares" variant="secondary" onPress={() => router.push('/PlacesScreen')} />
    </View>}
    {(device.error || state.error) && <AppText color="risk" accessibilityRole="alert">{device.error || state.error}</AppText>}
    {state.notice && <AppText color="muted" accessibilityLiveRegion="polite">{state.notice}</AppText>}
  </View>;
}
