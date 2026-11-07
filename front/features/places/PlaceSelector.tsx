import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppSelect } from '@/components/ui/AppSelect';
import {
  AppBottomSheetModal,
  BottomSheetView,
} from '@/components/ui/AppBottomSheetModal';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { usePlacesStore } from '@/stores/placesStore';
import { useDeviceLocation } from './useDeviceLocation';
import { RadiusControl } from './RadiusControl';
import { LocationEntryPrompt } from './LocationEntryPrompt';
import { layout, spacing, useTheme } from '@/theme';
import type { TerritorySelection } from './types';

export function PlaceSelector({ prompt = false }: { prompt?: boolean }) {
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
    return <AppText color="muted">Carregando localização…</AppText>;
  }

  const activePlace =
    selection.kind === 'radius' && selection.source === 'place'
      ? places.find((p) => p.id === selection.placeId)
      : undefined;

  const title =
    selection.kind === 'pending-current'
      ? 'Localização atual'
      : selection.kind === 'radius'
      ? activePlace?.name || selection.neighborhood?.name || 'Ao seu redor'
      : selection.kind === 'neighborhood'
      ? selection.name
      : 'Rio de Janeiro (Geral)';

  const subtitle =
    selection.kind === 'radius'
      ? `${
          selection.radiusMeters >= 1000
            ? `${selection.radiusMeters / 1000} km`
            : `${selection.radiusMeters} m`
        } de raio${
          selection.neighborhood?.name ? ` · ${selection.neighborhood.name}` : ''
        }`
      : selection.kind === 'neighborhood'
      ? 'Bairro completo'
      : 'Toda a cidade do Rio';

  const iconName: keyof typeof Ionicons.glyphMap =
    selection.kind === 'radius' && selection.source === 'current'
      ? 'navigate'
      : selection.kind === 'radius' && selection.source === 'place'
      ? 'bookmark'
      : selection.kind === 'neighborhood'
      ? 'business'
      : 'map';

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
            <Ionicons name={iconName} size={18} color={colors.ink} />
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
            <Ionicons name="chevron-down" size={14} color={colors.ink} />
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
              Sua posição anterior não foi salva. Atualize o GPS para consultar
              o entorno.
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

      {/* Bottom Sheet de Troca de Local */}
      <AppBottomSheetModal
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Trocar local"
        enableDynamicSizing
      >
        <BottomSheetView
          style={[
            styles.sheetContent,
            { paddingBottom: Math.max(insets.bottom + spacing.md, spacing.xxl) },
          ]}
        >
          {selection.kind === 'radius' && (
            <View style={{ gap: spacing.xs }}>
              <RadiusControl
                value={selection.radiusMeters}
                onChange={(radius) => {
                  void setRadius(radius);
                }}
              />
              {selection.neighborhood && (
                <AppButton
                  title={`Ver todo o bairro ${selection.neighborhood.name}`}
                  variant="secondary"
                  onPress={() => {
                    if (selection.neighborhood) {
                      void state.selectNeighborhood(
                        selection.neighborhood.name,
                        selection.neighborhood.id,
                      );
                      setSheetOpen(false);
                    }
                  }}
                />
              )}
            </View>
          )}

          {places.length > 0 && (
            <AppSelect
              clearable={false}
              label="Lugares salvos"
              value={activePlace?.id || ''}
              options={[
                { value: '', label: 'Selecione um lugar salvo...' },
                ...places.map((p) => ({ value: p.id, label: p.name })),
              ]}
              onChange={(id) => {
                if (id) {
                  void state.selectPlace(id);
                  setSheetOpen(false);
                }
              }}
            />
          )}

          <View style={{ gap: spacing.xs }}>
            <AppText variant="caption" color="muted">
              Consultar por bairro
            </AppText>
            <NeighborhoodPicker
              options={[]}
              value={selection.kind === 'neighborhood' ? selection.name : ''}
              onChange={(name) => {
                void state.dismissPrompt();
                void state.selectNeighborhood(name);
                setSheetOpen(false);
              }}
            />
          </View>

          <View style={styles.sheetActions}>
            <AppButton
              title={
                selection.kind === 'radius' && selection.source === 'current'
                  ? 'Atualizar GPS'
                  : 'Usar minha localização'
              }
              variant="secondary"
              loading={device.busy}
              onPress={() => {
                void device.captureLocation();
              }}
            />
            <AppButton
              title="Meus lugares salvos"
              variant="secondary"
              onPress={() => {
                setSheetOpen(false);
                router.push('/PlacesScreen');
              }}
            />
          </View>
        </BottomSheetView>
      </AppBottomSheetModal>

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

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  locationCard: {
    borderRadius: layout.radius.panel,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 1,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: layout.radius.pill,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inlineRadius: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  pendingArea: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.xs,
  },
  sheetContent: {
    paddingHorizontal: spacing.contentPadding,
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
  sheetActions: {
    gap: spacing.xs,
  },
  errorText: {
    paddingHorizontal: spacing.xs,
    fontSize: 13,
  },
  noticeText: {
    paddingHorizontal: spacing.xs,
    fontSize: 13,
  },
});
