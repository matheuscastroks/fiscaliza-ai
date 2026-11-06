import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { PlaceEditor } from '@/features/places/PlaceEditor';
import { usePlacesStore } from '@/stores/placesStore';
import { goBack } from '@/utils/navigation';
import { spacing } from '@/theme';

export default function PlacesScreen() {
  const state = usePlacesStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  return <AppScreen>
    <AppHeader title="Meus lugares" onBack={() => goBack()} />
    <KeyboardAwareScrollView contentContainerStyle={{ padding: spacing.contentPadding, paddingBottom: 120, gap: spacing.xl }}>
      <AppText color="muted">Guarde endereços para voltar aos chamados do entorno. Os lugares ficam neste aparelho, sem sincronização.</AppText>
      {!state.hydrated ? <AppText>Carregando lugares…</AppText> : editing !== null ?
        <PlaceEditor key={editing} initialPlace={state.places.find((p) => p.id === editing)} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} /> : <>
          <AppButton title="Adicionar lugar" onPress={() => setEditing('new')} />
          {!state.places.length && <AppText color="muted">Você ainda não salvou lugares. Adicione Casa, Trabalho ou um ponto que queira acompanhar.</AppText>}
          {state.places.map((place) => <View key={place.id} style={{ gap: spacing.sm }}>
            <AppText variant="sectionTitle">{place.name}</AppText>
            <AppText color="muted">{place.addressLabel || place.neighborhood?.name || 'Ponto confirmado'} · {place.radiusMeters < 1000 ? `${place.radiusMeters} m` : `${place.radiusMeters / 1000} km`}</AppText>
            <AppButton title={`Consultar entorno de ${place.name}`} variant="secondary" disabled={state.busy} onPress={() => { void state.selectPlace(place.id).then((ok) => { if (ok) router.navigate('/(tabs)'); }); }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <AppButton title="Editar" variant="secondary" disabled={state.busy} onPress={() => setEditing(place.id)} />
              <AppButton title="Excluir" variant="secondary" disabled={state.busy} onPress={() => setRemoving(place.id)} />
            </View>
            {removing === place.id && <View style={{ gap: spacing.sm }}>
              <AppText>Excluir {place.name}? Se estiver selecionado, a consulta voltará ao bairro associado ou ao município.</AppText>
              <AppButton title="Confirmar exclusão" variant="destructive" loading={state.busy} onPress={() => { void state.deletePlace(place.id).then((ok) => { if (ok) setRemoving(null); }); }} />
              <AppButton title="Manter lugar" variant="secondary" disabled={state.busy} onPress={() => setRemoving(null)} />
            </View>}
          </View>)}
        </>}
      {state.error && <AppText color="risk" accessibilityRole="alert">{state.error}</AppText>}
    </KeyboardAwareScrollView>
  </AppScreen>;
}
