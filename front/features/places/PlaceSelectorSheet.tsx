import React, { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppBottomSheetModal, BottomSheetScrollView } from '@/components/ui/AppBottomSheetModal';
import { ListRow } from '@/components/ui/ListRow';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Surface } from '@/components/ui/Surface';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import type { usePlacesStore } from '@/stores/placesStore';
import type { useDeviceLocation } from './useDeviceLocation';
import { RadiusControl } from './RadiusControl';
import { spacing } from '@/theme';
import type { SavedPlace, TerritorySelection } from './types';

type PlacesState = ReturnType<typeof usePlacesStore.getState>;
const noNeighborhoodFallback: string[] = [];

export function PlaceSelectorSheet({
  sheetOpen, setSheetOpen, state, selection, places, setRadius, device,
  activePlace, title, areaOnly, onClearAreaOnly,
}: {
  sheetOpen: boolean;
  setSheetOpen: (value: boolean) => void;
  state: PlacesState;
  selection: TerritorySelection;
  places: SavedPlace[];
  setRadius: PlacesState['setRadius'];
  device: ReturnType<typeof useDeviceLocation>;
  activePlace: SavedPlace | null | undefined;
  title: string;
  areaOnly: boolean;
  onClearAreaOnly: (() => void) | undefined;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [bodyHeight, setBodyHeight] = useState(0);
  const snapPoint = headerHeight && bodyHeight
    ? Math.ceil(Math.min(windowHeight - insets.top - spacing.sm, headerHeight + bodyHeight + 30))
    : '75%';
  const close = () => setSheetOpen(false);
  const choose = (action?: () => void) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClearAreaOnly?.();
    action?.();
    close();
  };
  const managePlaces = () => {
    close();
    router.push('/PlacesScreen');
  };
  const currentLocation = selection.kind === 'radius' && selection.source === 'current';
  const neighborhood = selection.kind === 'radius' ? selection.neighborhood : undefined;

  return (
    <AppBottomSheetModal
      visible={sheetOpen}
      onClose={close}
      title="Trocar área"
      snapPoints={[snapPoint]}
      onHeaderHeightChange={setHeaderHeight}
    >
      <BottomSheetScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={(_, height) => setBodyHeight(height)}
      >
        <View style={styles.section}>
          <SectionHeader title="Bairro" />
          <NeighborhoodPicker
            options={noNeighborhoodFallback}
            value={selection.kind === 'neighborhood' ? selection.name : ''}
            triggerLabel="Buscar bairro"
            onChange={(name) => choose(() => {
              void state.dismissPrompt();
              void state.selectNeighborhood(name);
            })}
          />
          <AppText variant="caption" color="muted">
            Área em uso · {title}
          </AppText>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Outras áreas" />
          <Surface padded={false} tone="recessed" elevation="recessed" clipContent>
            {areaOnly && onClearAreaOnly && (
              <ListRow title="Voltar à área escolhida" onPress={() => choose()} />
            )}
            <ListRow
              title={device.busy ? 'Buscando localização…' : currentLocation ? 'Atualizar minha localização' : 'Usar minha localização'}
              onPress={device.busy ? undefined : () => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                void device.captureLocation().then((location) => {
                  if (location) {
                    onClearAreaOnly?.();
                    close();
                  }
                });
              }}
            />
            <ListRow title="A cidade toda" onPress={() => choose(() => { void state.selectNeighborhood(''); })} />
            {neighborhood && (
              <ListRow title={`Ver todo o bairro ${neighborhood.name}`} onPress={() => choose(() => {
                void state.selectNeighborhood(neighborhood.name, neighborhood.id);
              })} />
            )}
          </Surface>
        </View>

        {(selection.kind === 'radius' || selection.kind === 'pending-current') && (
          <View style={styles.section}>
            <SectionHeader title="Até onde olhar" />
            {selection.kind === 'pending-current' && (
              <AppText variant="caption" color="muted">Atualize sua localização para ver o que está perto de você.</AppText>
            )}
            <RadiusControl value={selection.radiusMeters} onChange={(radius) => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClearAreaOnly?.();
              void setRadius(radius);
            }} />
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader title="Meus lugares" />
          {places.length > 0 && (
            <Surface padded={false} tone="recessed" elevation="recessed" clipContent>
              {places.map((place) => (
                <ListRow
                  key={place.id}
                  title={place.name}
                  subtitle={activePlace?.id === place.id && !areaOnly ? 'Área em uso' : undefined}
                  onPress={() => choose(() => { void state.selectPlace(place.id); })}
                />
              ))}
            </Surface>
          )}
          <AppButton title={places.length > 0 ? 'Gerenciar lugares' : 'Adicionar um lugar'} variant="quiet" onPress={managePlaces} />
        </View>
      </BottomSheetScrollView>
    </AppBottomSheetModal>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.contentPadding, paddingTop: spacing.xs, gap: spacing.lg },
  section: { gap: spacing.xs },
});
