import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import * as Location from 'expo-location';
import type {
  AppleMaps as AppleMapsNamespace,
  Coordinates,
  GoogleMaps as GoogleMapsNamespace,
} from 'expo-maps';
import { AppText } from '@/components/ui/AppText';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { useAuthStore } from '@/stores/authStore';
import {
  municipalityRegion,
  regionToCameraPosition,
  withinMunicipalBounds,
} from '@/features/city/municipalContext';

let AppleMaps: typeof AppleMapsNamespace | null = null;
let GoogleMaps: typeof GoogleMapsNamespace | null = null;
if (Platform.OS !== 'web' && requireOptionalNativeModule('ExpoMaps')) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maps = require('expo-maps') as {
      AppleMaps: typeof AppleMapsNamespace;
      GoogleMaps: typeof GoogleMapsNamespace;
    };
    AppleMaps = maps.AppleMaps;
    GoogleMaps = maps.GoogleMaps;
  } catch {
    AppleMaps = null;
    GoogleMaps = null;
  }
}
const hasNativeMap =
  (Platform.OS === 'ios' && Boolean(AppleMaps)) ||
  (Platform.OS === 'android' && Boolean(GoogleMaps));

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
  heading?: string;
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
  heading = 'Onde fica o problema?',
}: Props) {
  const { colors, mode } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  const municipality = useAuthStore((state) => state.user?.municipality);
  const mapRef = useRef<
    AppleMapsNamespace.MapView | GoogleMapsNamespace.MapView | null
  >(null);
  const cameraPosition = regionToCameraPosition(
    selected
      ? {
          latitude,
          longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }
      : municipalityRegion(municipality),
  );
  useEffect(() => {
    if (selected) {
      mapRef.current?.setCameraPosition(
        regionToCameraPosition({
          latitude,
          longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }),
      );
    }
  }, [selected, latitude, longitude]);
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
  const handleMapClick = (event: { coordinates: Coordinates }) => {
    if (
      typeof event.coordinates.latitude === 'number' &&
      typeof event.coordinates.longitude === 'number'
    ) {
      selectPoint({
        latitude: event.coordinates.latitude,
        longitude: event.coordinates.longitude,
      });
    }
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
    <View style={{ gap: spacing.md }}>
      <AppText variant="sectionTitle">{heading}</AppText>
      <AppText color="muted">
        {municipality?.name} · {municipality?.state}
      </AppText>
      {hasNativeMap && (
        <View collapsable={false} style={styles.mapFrame}>
          {Platform.OS === 'ios' && AppleMaps ? (
            <AppleMaps.View
              ref={
                mapRef as React.RefObject<AppleMapsNamespace.MapView | null>
              }
              style={styles.map}
              colorScheme={
                mode === 'dark'
                  ? AppleMaps.MapColorScheme.DARK
                  : AppleMaps.MapColorScheme.LIGHT
              }
              cameraPosition={cameraPosition}
              markers={
                selected
                  ? [
                      {
                        id: 'selected-location',
                        coordinates: { latitude, longitude },
                        title: address || 'Local selecionado',
                        tintColor: colors.accent,
                      },
                    ]
                  : []
              }
              onMapClick={handleMapClick}
            />
          ) : Platform.OS === 'android' && GoogleMaps ? (
            <GoogleMaps.View
              ref={
                mapRef as React.RefObject<GoogleMapsNamespace.MapView | null>
              }
              style={styles.map}
              colorScheme={
                mode === 'dark'
                  ? GoogleMaps.MapColorScheme.DARK
                  : GoogleMaps.MapColorScheme.LIGHT
              }
              cameraPosition={cameraPosition}
              markers={
                selected
                  ? [
                      {
                        id: 'selected-location',
                        coordinates: { latitude, longitude },
                        title: address || 'Local selecionado',
                        draggable: true,
                        showCallout: Boolean(address),
                      },
                    ]
                  : []
              }
              onMapClick={handleMapClick}
            />
          ) : null}
        </View>
      )}
      {hasNativeMap && (
        <AppText variant="meta" color="muted">
          Toque no mapa para marcar o local.
        </AppText>
      )}
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
      {!hasNativeMap && (
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
          {!hasNativeMap
            ? 'Ponto selecionado: ' +
              latitude.toFixed(5) +
              ', ' +
              longitude.toFixed(5)
            : 'Local marcado no mapa'}
        </AppText>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    mapFrame: {
      borderRadius: layout.radius.card,
      overflow: 'hidden',
      backgroundColor: colors.surfaceSubdued,
    },
    map: { height: 260, width: '100%', borderRadius: layout.radius.card },
  });
