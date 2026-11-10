import React, { useState } from 'react';

import { View, Pressable } from 'react-native';


import { Ionicons } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';


import { AppText } from '@/components/ui/AppText';

import { AppButton } from '@/components/ui/AppButton';


import { usePlacesStore } from '@/stores/placesStore';

import { useDeviceLocation } from './useDeviceLocation';

import { RadiusControl } from './RadiusControl';

import { LocationEntryPrompt } from './LocationEntryPrompt';

import { layout, useTheme } from '@/theme';

import type { TerritorySelection } from './types';


import { formatRadius } from '@/features/places/placeDisplay';
import { styles } from './PlaceSelector.styles';
import { PlaceSelectorSheet } from './PlaceSelectorSheet';


export function PlaceSelector({
  prompt = false,
  compactHeader = false,
  areaOnly = false,
  onClearAreaOnly,
  rightAction,
  renderTrigger,
}: {
  prompt?: boolean;
  compactHeader?: boolean;
  areaOnly?: boolean;
  onClearAreaOnly?: () => void;
  rightAction?: React.ReactNode;
  renderTrigger?: (props: {
    onPress: () => void;
    summary: string;
    shortSummary: string;
    iconName: keyof typeof Ionicons.glyphMap;
  }) => React.ReactNode;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const state = usePlacesStore();
  const { selection, places, setRadius } = state;
  const device = useDeviceLocation();
  const [expandedSelection, setExpandedSelection] =
    useState<TerritorySelection | null>(null);

  const sheetOpen = expandedSelection === selection;
  const setSheetOpen = (value: boolean) =>
    setExpandedSelection(value ? selection : null);

  if (!state.hydrated) {
    if (compactHeader || renderTrigger) return null;
    return <AppText color="muted">Carregando localização…</AppText>;
  }

  const activePlace =
    selection.kind === 'radius' && selection.source === 'place'
      ? places.find((p) => p.id === selection.placeId)
      : undefined;

  const radiusShort =
    selection.kind === 'radius' || selection.kind === 'pending-current'
      ? formatRadius(selection.radiusMeters)
      : '';

  const title = areaOnly
    ? 'Área visível no mapa'
    : selection.kind === 'pending-current'
      ? 'Localização atual'
      : selection.kind === 'radius'
        ? activePlace?.name || selection.neighborhood?.name || 'Ao seu redor'
        : selection.kind === 'neighborhood'
          ? selection.name
          : 'Rio de Janeiro (Geral)';

  const subtitle = areaOnly
    ? 'Área definida pelo mapa'
    : selection.kind === 'radius'
      ? `${radiusShort} de distância${
          selection.neighborhood?.name ? ` · ${selection.neighborhood.name}` : ''
        }`
      : selection.kind === 'neighborhood'
        ? 'Bairro completo'
        : 'A cidade toda';

  const compactSummary = areaOnly
    ? 'Área visível no mapa'
    : selection.kind === 'pending-current'
      ? `Localização atual · ${radiusShort}`
      : selection.kind === 'radius'
        ? `${
            activePlace?.name || selection.neighborhood?.name || 'Ao seu redor'
          } · ${radiusShort}`
        : selection.kind === 'neighborhood'
          ? selection.name
          : 'Rio de Janeiro (Geral)';

  const iconName: keyof typeof Ionicons.glyphMap = areaOnly
    ? 'scan-outline'
    : selection.kind === 'radius' && selection.source === 'current'
      ? 'navigate'
      : selection.kind === 'radius' && selection.source === 'place'
        ? 'bookmark'
        : selection.kind === 'neighborhood'
          ? 'business'
          : 'location';


  const sheet = (
    <PlaceSelectorSheet sheetOpen={sheetOpen} setSheetOpen={setSheetOpen} state={state} selection={selection} places={places} setRadius={setRadius} device={device} activePlace={activePlace} title={title} subtitle={subtitle} iconName={iconName} areaOnly={areaOnly} onClearAreaOnly={onClearAreaOnly} />
  );

  const shortSummary = areaOnly
    ? 'Área no mapa'
    : selection.kind === 'pending-current'
      ? 'Perto de mim'
      : selection.kind === 'radius'
        ? activePlace?.name || selection.neighborhood?.name || 'Perto daqui'
        : selection.kind === 'neighborhood'
          ? selection.name
          : 'Rio';

  if (renderTrigger) {
    return (
      <>
        {renderTrigger({
          onPress: () => setSheetOpen(true),
          summary: compactSummary,
          shortSummary,
          iconName,
        })}
        {sheet}
      </>
    );
  }

  if (compactHeader) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactTopRow}>
          <Pressable
            onPress={() => setSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Área: ${compactSummary}. Toque para trocar local.`}
            style={({ pressed }) => [
              styles.compactPill,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <View
              style={[
                styles.compactIconBadge,
                {
                  backgroundColor: isDark
                    ? colors.surfaceSubdued
                    : colors.canvas,
                },
              ]}
            >
              <Ionicons
                name={iconName}
                size={layout.iconSize.sm}
                color={colors.onSurfaceBrand}
              />
            </View>

            <AppText
              variant="label"
              numberOfLines={1}
              style={styles.compactTitle}
            >
              {compactSummary}
            </AppText>

            <View
              style={[
                styles.compactChangeChip,
                {
                  backgroundColor: isDark
                    ? colors.surfaceSubdued
                    : colors.canvas,
                },
              ]}
            >
              <AppText variant="caption" style={styles.compactChangeText}>
                Trocar
              </AppText>
              <Ionicons name="chevron-down" size={layout.iconSize.sm} color={colors.ink} />
            </View>
          </Pressable>

          {rightAction}
        </View>

        {prompt && (
          <LocationEntryPrompt
            compact
            busy={device.busy}
            onChoose={() => setSheetOpen(true)}
            onLocate={() => {
              onClearAreaOnly?.();
              void device.captureLocation();
            }}
          />
        )}

        {sheet}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {prompt && (
        <LocationEntryPrompt
          busy={device.busy}
          onChoose={() => setSheetOpen(true)}
          onLocate={() => {
            void device.captureLocation();
          }}
        />
      )}

      {/* Location Bar Card */}
      <View
        style={[
          styles.locationCard,
          {
            backgroundColor: isDark ? colors.surfaceSubdued : colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Local atual: ${title}, ${subtitle}. Toque para trocar local.`}
          style={({ pressed }) => [
            styles.cardHeader,
            pressed && { opacity: 0.8 },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark
                  ? colors.surface
                  : colors.surfaceSubdued,
              },
            ]}
          >
            <Ionicons name={iconName} size={layout.iconSize.md} color={colors.ink} />
          </View>

          <View style={styles.headerInfo}>
            <AppText variant="label" numberOfLines={1}>
              {title}
            </AppText>
            <AppText variant="caption" color="muted" numberOfLines={1}>
              {subtitle}
            </AppText>
          </View>

          <View
            style={[
              styles.changeBadge,
              {
                backgroundColor: isDark
                  ? colors.surface
                  : colors.surfaceSubdued,
              },
            ]}
          >
            <AppText variant="caption" style={styles.changeText}>
              Trocar local
            </AppText>
            <Ionicons name="chevron-down" size={layout.iconSize.sm} color={colors.ink} />
          </View>
        </Pressable>

        {/* Raio sempre visível quando em modo raio */}
        {selection.kind === 'radius' && (
          <View style={styles.inlineRadius}>
            <RadiusControl
              compact
              value={selection.radiusMeters}
              onChange={(radius) => {
                void setRadius(radius);
              }}
            />
          </View>
        )}

        {/* Estado pendente de localização atual */}
        {selection.kind === 'pending-current' && (
          <View style={styles.pendingArea}>
            <AppText variant="caption" color="muted">
              Sua localização antiga não foi guardada. Atualize para ver o que está perto.
            </AppText>
            <AppButton
              title="Atualizar localização"
              loading={device.busy}
              onPress={() => {
                void device.captureLocation();
              }}
            />
          </View>
        )}
      </View>

      {sheet}

      {(device.error || state.error) && (
        <AppText color="risk" accessibilityRole="alert" style={styles.errorText}>
          {device.error || state.error}
        </AppText>
      )}

      {state.notice && (
        <AppText
          color="muted"
          accessibilityLiveRegion="polite"
          style={styles.noticeText}
        >
          {state.notice}
        </AppText>
      )}
    </View>
  );
}
