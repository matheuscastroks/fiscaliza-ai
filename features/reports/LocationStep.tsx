import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import { AppText } from '@/components/ui/AppText';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { useAuthStore } from '@/stores/authStore';
import {
  withinMunicipalBounds,
} from '@/features/city/municipalContext';
import { OsmMapView } from '@/components/ui/OsmMapView';

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
    <View style={{ gap: spacing.md }}>
      <AppText variant="sectionTitle">{heading}</AppText>
      <AppText color="muted">
        {municipality?.name} · {municipality?.state}
      </AppText>
      <View collapsable={false} style={styles.mapFrame}>
        <OsmMapView
          style={styles.map}
          region={{
            latitude: selected ? latitude : (municipality?.center.latitude || -22.9068),
            longitude: selected ? longitude : (municipality?.center.longitude || -43.1729),
            zoom: selected ? 16 : 12,
          }}
          markers={
            selected
              ? [
                  {
                    id: 'selected-location',
                    latitude,
                    longitude,
                    title: address || 'Local selecionado',
                    draggable: true,
                    color: colors.accent,
                  },
                ]
              : []
          }
          isDark={mode === 'dark'}
          onMapClick={(coords) => selectPoint(coords)}
        />
      </View>
      <AppText variant="meta" color="muted">
        Toque no mapa ou arraste o pino para marcar o local.
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
      {selected && (
        <AppText color="completed">
          {'Ponto selecionado: ' +
            latitude.toFixed(5) +
            ', ' +
            longitude.toFixed(5)}
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
