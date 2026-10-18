import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import * as Location from 'expo-location';
import { AppText } from '@/components/ui/AppText';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { useAuthStore } from '@/stores/authStore';
import {
  municipalityRegion,
  withinMunicipalBounds,
} from '@/features/city/municipalContext';
let NativeMap: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const maps = require('react-native-maps');
  NativeMap = maps.default;
  Marker = maps.Marker;
}
interface Props {
  address: string;
  neighborhood: string;
  onNeighborhoodChange: (value: string) => void;
  latitude: number;
  longitude: number;
  selected: boolean;
  onAddressChange: (value: string) => void;
  onLocationChange: (point: {
    latitude: number;
    longitude: number;
    address?: string;
    neighborhood?: string;
  }) => void;
  error?: string | null;
}
export function LocationStep({
  address,
  neighborhood,
  onNeighborhoodChange,
  latitude,
  longitude,
  selected,
  onAddressChange,
  onLocationChange,
  error,
}: Props) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  const municipality = useAuthStore((state) => state.user?.municipality);
  const selectPoint = (point: { latitude: number; longitude: number }) => {
    if (!withinMunicipalBounds(point, municipality)) {
      setMessage(
        `O local precisa estar dentro de ${municipality?.name || 'seu município'}.`,
      );
      return;
    }
    onLocationChange(point);
    setMessage('');
  };
  const locate = async () => {
    setBusy(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setMessage(
          Platform.OS === 'web'
            ? 'Use as coordenadas do local ou autorize a localização.'
            : 'Você pode marcar o ponto no mapa sem usar sua posição atual.',
        );
        return;
      }
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      selectPoint({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      });
    } catch {
      setMessage('Localização indisponível. Marque o ponto manualmente.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: 16, paddingVertical: 16 }}>
      <AppText variant="sectionTitle">Onde fica o problema?</AppText>
      <AppText color="muted">
        {municipality?.name} · {municipality?.state}
      </AppText>
      <AppInput
        label="Rua, número ou ponto de referência"
        value={address}
        onChangeText={onAddressChange}
        error={error}
      />
      <AppInput
        label="Bairro"
        value={neighborhood}
        onChangeText={onNeighborhoodChange}
        maxLength={120}
      />
      {NativeMap && (
        <NativeMap
          style={{ height: 240, width: '100%' }}
          region={
            selected
              ? {
                  latitude,
                  longitude,
                  latitudeDelta: 0.012,
                  longitudeDelta: 0.012,
                }
              : municipalityRegion(municipality)
          }
          onPress={(event: {
            nativeEvent: {
              coordinate: { latitude: number; longitude: number };
            };
          }) => selectPoint(event.nativeEvent.coordinate)}
        >
          {selected && (
            <Marker
              coordinate={{ latitude, longitude }}
              draggable
              onDragEnd={(event: {
                nativeEvent: {
                  coordinate: { latitude: number; longitude: number };
                };
              }) => selectPoint(event.nativeEvent.coordinate)}
            />
          )}
        </NativeMap>
      )}
      <AppButton
        title="Usar minha posição"
        variant="secondary"
        loading={busy}
        onPress={() => {
          void locate();
        }}
      />
      {message !== '' && (
        <AppText color="muted" accessibilityLiveRegion="polite">
          {message}
        </AppText>
      )}
      {Platform.OS === 'web' && (
        <>
          <AppButton
            title={
              manual ? 'Ocultar coordenadas' : 'Informar coordenadas do local'
            }
            variant="quiet"
            onPress={() => setManual(!manual)}
          />
          {manual && (
            <>
              <AppInput
                label="Latitude"
                value={manualLatitude}
                onChangeText={setManualLatitude}
                placeholder="Ex.: -22,903"
                keyboardType="decimal-pad"
              />
              <AppInput
                label="Longitude"
                value={manualLongitude}
                onChangeText={setManualLongitude}
                placeholder="Ex.: -43,185"
                keyboardType="decimal-pad"
              />
              <AppButton
                title="Confirmar ponto"
                variant="secondary"
                disabled={!manualLatitude.trim() || !manualLongitude.trim()}
                onPress={() =>
                  selectPoint({
                    latitude: Number(manualLatitude.replace(',', '.')),
                    longitude: Number(manualLongitude.replace(',', '.')),
                  })
                }
              />
            </>
          )}
        </>
      )}
      {selected && (
        <AppText color="completed">
          Ponto selecionado: {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </AppText>
      )}
    </View>
  );
}
