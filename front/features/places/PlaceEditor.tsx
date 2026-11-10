import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { MapboxMapView } from '@/components/ui/MapboxMapView';
import { fetchTerritoryLocation } from '@/services/publicData';
import { usePlacesStore } from '@/stores/placesStore';
import { useDeviceLocation } from './useDeviceLocation';
import { RadiusControl } from './RadiusControl';
import { validatePlace } from './selection';
import type { SavedPlace, Point, RadiusMeters } from './types';
import { spacing, useTheme } from '@/theme';
import { layout } from '@/theme/layout';

export function PlaceEditor({ initialPlace, onDone, onCancel }: { initialPlace?: SavedPlace; onDone: () => void; onCancel: () => void }) {
  const { colors, isDark } = useTheme();
  const [name, setName] = useState(initialPlace?.name || '');
  const [addressLabel, setAddressLabel] = useState(initialPlace?.addressLabel || '');
  const [latitude, setLatitude] = useState(initialPlace ? String(initialPlace.latitude) : '');
  const [longitude, setLongitude] = useState(initialPlace ? String(initialPlace.longitude) : '');
  const [radiusMeters, setRadius] = useState<RadiusMeters>(initialPlace?.radiusMeters || 1000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const device = useDeviceLocation();
  const revision = useRef(0);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => { revision.current++; abort.current?.abort(); }, []);
  const point = { latitude: latitude.trim() ? Number(latitude.replace(',', '.')) : NaN, longitude: longitude.trim() ? Number(longitude.replace(',', '.')) : NaN };
  const validPoint = Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180;
  const changePoint = (next: Point) => { revision.current++; setLatitude(String(next.latitude)); setLongitude(String(next.longitude)); };
  const save = async () => {
    const draft = { name, addressLabel, ...point, radiusMeters };
    const validation = validatePlace(draft);
    if (validation) { setError(validation); return; }
    const version = ++revision.current;
    const initial = usePlacesStore.getState();
    const controller = new AbortController(); abort.current = controller;
    setBusy(true); setError(null);
    try {
      const result = await fetchTerritoryLocation(point, controller.signal);
      if (version !== revision.current) return;
      if (!result.insideMunicipality) throw Error('Confirme um ponto dentro do Rio de Janeiro.');
      const state = usePlacesStore.getState();
      if (state.userId !== initial.userId || state.municipalityId !== initial.municipalityId) return;
      const data = { ...draft, neighborhood: result.neighborhood };
      const ok = initialPlace ? await state.updatePlace(initialPlace.id, data) : await state.createPlace(data);
      if (version !== revision.current) return;
      if (ok) onDone(); else setError(usePlacesStore.getState().error || 'Não foi possível salvar. Tente novamente.');
    } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Não foi possível confirmar o local.'); }
    finally { if (abort.current === controller && !controller.signal.aborted) setBusy(false); }
  };
  return <View style={{ gap: spacing.md }}>
    <AppText variant="sectionTitle">{initialPlace ? 'Editar lugar' : 'Adicionar lugar'}</AppText>
    <AppInput label="Nome do lugar" showLabel placeholder="Casa, Trabalho ou outro nome" value={name} editable={!busy} onChangeText={(text) => { revision.current++; setName(text); }} />
    <AppInput label="Endereço ou referência (opcional)" showLabel value={addressLabel} editable={!busy} onChangeText={(text) => { revision.current++; setAddressLabel(text); }} />
    <AppText color="muted">Confirme o local no mapa. Digitar o endereço não posiciona o marcador. O endereço e o nome ficam neste aparelho.</AppText>
    <AppButton title="Usar minha localização como ponto" variant="secondary" disabled={busy} loading={device.busy} onPress={() => {
      const version = revision.current;
      void device.captureLocation(false).then((result) => { if (result && version === revision.current) changePoint(result); });
    }} />
    <View style={{ height: 240, borderRadius: layout.radius.card, overflow: 'hidden', backgroundColor: colors.surface }}>
      <MapboxMapView region={{ ...(validPoint ? point : { latitude: -22.91, longitude: -43.2 }), zoom: 14 }} markers={validPoint ? [{ ...point, id: 'place', title: name || 'Lugar' }] : []} onMapClick={(p) => { if (!busy) changePoint(p); }} interactive={!busy} isDark={isDark} />
    </View>
    <AppText variant="label">Confirmar por coordenadas</AppText>
    <AppText variant="caption" color="muted">Alternativa ao mapa. Exemplo de formato: -22.91 e -43.20.</AppText>
    <AppInput label="Latitude" showLabel value={latitude} editable={!busy} keyboardType="numbers-and-punctuation" onChangeText={(v) => { revision.current++; setLatitude(v); }} />
    <AppInput label="Longitude" showLabel value={longitude} editable={!busy} keyboardType="numbers-and-punctuation" onChangeText={(v) => { revision.current++; setLongitude(v); }} />
    <RadiusControl value={radiusMeters} onChange={(r) => { if (!busy) { revision.current++; setRadius(r); } }} />
    {(error || device.error) && <AppText color="risk" accessibilityRole="alert">{error || device.error}</AppText>}
    <AppButton title="Confirmar ponto e salvar lugar" loading={busy} onPress={() => { void save(); }} />
    <AppButton title="Cancelar" variant="secondary" disabled={busy} onPress={onCancel} />
  </View>;
}
