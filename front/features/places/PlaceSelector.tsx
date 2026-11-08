import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppSelect } from '@/components/ui/AppSelect';
import {
  AppBottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
} from '@/components/ui/AppBottomSheetModal';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { usePlacesStore } from '@/stores/placesStore';
import { useDeviceLocation } from './useDeviceLocation';
import { RadiusControl } from './RadiusControl';
import { LocationEntryPrompt } from './LocationEntryPrompt';
import { layout, spacing, useTheme } from '@/theme';
import type { TerritorySelection } from './types';

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
      ? selection.radiusMeters >= 1000
        ? `${selection.radiusMeters / 1000} km`
        : `${selection.radiusMeters} m`
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
    ? 'Recorte definido pelo movimento do mapa'
    : selection.kind === 'radius'
      ? `${radiusShort} de raio${
          selection.neighborhood?.name ? ` · ${selection.neighborhood.name}` : ''
        }`
      : selection.kind === 'neighborhood'
        ? 'Bairro completo'
        : 'Toda a cidade do Rio';

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

  const renderBottomSheet = () => (
    <AppBottomSheetModal
      visible={sheetOpen}
      onClose={() => setSheetOpen(false)}
      title="Trocar Local"
      snapPoints={['75%', '92%']}
    >
      <BottomSheetScrollView
        style={styles.sheetScroll}
        contentContainerStyle={[
          styles.sheetScrollBody,
          { paddingBottom: Math.max(insets.bottom + spacing.lg, spacing.xxl) },
        ]}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card de Destaque: Recorte Atual */}
        <View
          style={[
            styles.heroScopeCard,
            {
              backgroundColor: isDark ? colors.surfaceSubdued : colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.heroScopeIconBadge,
              { backgroundColor: isDark ? colors.surface : colors.canvas },
            ]}
          >
            <Ionicons name={iconName} size={20} color={colors.onSurfaceBrand} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <AppText variant="caption" color="muted" style={styles.heroScopeLabel}>
              Recorte Ativo
            </AppText>
            <AppText variant="label" numberOfLines={1} style={styles.heroScopeTitle}>
              {title}
            </AppText>
            <AppText variant="caption" color="muted" numberOfLines={1}>
              {subtitle}
            </AppText>
          </View>
          {areaOnly && onClearAreaOnly && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar ao recorte salvo"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClearAreaOnly();
                setSheetOpen(false);
              }}
              style={({ pressed }) => [
                styles.undoAreaButton,
                { backgroundColor: colors.accent },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="arrow-undo" size={14} color={colors.onAccent} />
              <AppText variant="caption" style={{ color: colors.onAccent, fontWeight: '700' }}>
                Voltar
              </AppText>
            </Pressable>
          )}
        </View>

        {/* Grupo 1: Ações Rápidas (Estilo Apple Inset Grouped) */}
        <View style={styles.groupContainer}>
          <AppText variant="caption" color="muted" style={styles.groupHeaderLabel}>
            Ações Rápidas
          </AppText>
          <View style={[styles.insetGroupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Linha GPS */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                selection.kind === 'radius' && selection.source === 'current'
                  ? 'Atualizar GPS'
                  : 'Usar minha localização'
              }
              disabled={device.busy}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClearAreaOnly?.();
                void device.captureLocation().then((loc) => {
                  if (loc) setSheetOpen(false);
                });
              }}
              style={({ pressed }) => [
                styles.insetRow,
                pressed && { backgroundColor: colors.surfaceSubdued },
              ]}
            >
              <View style={[styles.rowIconBadge, { backgroundColor: '#2563EB18' }]}>
                <Ionicons name="navigate" size={17} color="#2563EB" />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                <AppText variant="caption" style={styles.rowTitle}>
                  {selection.kind === 'radius' && selection.source === 'current'
                    ? 'Atualizar GPS'
                    : 'Usar minha localização'}
                </AppText>
                <AppText variant="caption" color="muted" style={styles.rowDesc}>
                  Capturar coordenadas do dispositivo
                </AppText>
              </View>
              {device.busy ? (
                <AppText variant="caption" color="muted">Buscando...</AppText>
              ) : selection.kind === 'radius' && selection.source === 'current' ? (
                <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
              ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              )}
            </Pressable>

            <View style={[styles.insetDivider, { backgroundColor: colors.divider }]} />

            {/* Linha Todo o Município */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver todo o município do Rio de Janeiro"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClearAreaOnly?.();
                void state.selectNeighborhood('');
                setSheetOpen(false);
              }}
              style={({ pressed }) => [
                styles.insetRow,
                pressed && { backgroundColor: colors.surfaceSubdued },
              ]}
            >
              <View style={[styles.rowIconBadge, { backgroundColor: '#10B98118' }]}>
                <Ionicons name="globe-outline" size={17} color="#10B981" />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                <AppText variant="caption" style={styles.rowTitle}>
                  Todo o município do Rio
                </AppText>
                <AppText variant="caption" color="muted" style={styles.rowDesc}>
                  Visualizar toda a cidade do Rio de Janeiro
                </AppText>
              </View>
              {selection.kind === 'municipality' && !areaOnly ? (
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              )}
            </Pressable>

            {/* Linha Ver Bairro Inteiro (se estiver em modo raio com bairro identificado) */}
            {selection.kind === 'radius' && selection.neighborhood && (
              <>
                <View style={[styles.insetDivider, { backgroundColor: colors.divider }]} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ver todo o bairro ${selection.neighborhood.name}`}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (selection.neighborhood) {
                      onClearAreaOnly?.();
                      void state.selectNeighborhood(
                        selection.neighborhood.name,
                        selection.neighborhood.id,
                      );
                      setSheetOpen(false);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.insetRow,
                    pressed && { backgroundColor: colors.surfaceSubdued },
                  ]}
                >
                  <View style={[styles.rowIconBadge, { backgroundColor: '#F59E0B18' }]}>
                    <Ionicons name="business" size={17} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                    <AppText variant="caption" style={styles.rowTitle}>
                      Ver todo o bairro {selection.neighborhood.name}
                    </AppText>
                    <AppText variant="caption" color="muted" style={styles.rowDesc}>
                      Expandir a busca para o bairro completo
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* Grupo 2: Lugares Salvos */}
        <View style={styles.groupContainer}>
          <View style={styles.groupHeaderRow}>
            <AppText variant="caption" color="muted" style={styles.groupHeaderLabel}>
              Meus Lugares Salvos
            </AppText>
            <Pressable
              onPress={() => {
                setSheetOpen(false);
                router.push('/PlacesScreen');
              }}
              hitSlop={8}
            >
              <AppText variant="caption" style={{ color: colors.accent, fontWeight: '700' }}>
                Gerenciar
              </AppText>
            </Pressable>
          </View>

          {places.length > 0 ? (
            <View style={[styles.insetGroupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {places.map((p, idx) => {
                const isSelected = activePlace?.id === p.id;
                return (
                  <React.Fragment key={p.id}>
                    {idx > 0 && <View style={[styles.insetDivider, { backgroundColor: colors.divider }]} />}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar lugar ${p.name}`}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onClearAreaOnly?.();
                        void state.selectPlace(p.id);
                        setSheetOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.insetRow,
                        pressed && { backgroundColor: colors.surfaceSubdued },
                      ]}
                    >
                      <View style={[styles.rowIconBadge, { backgroundColor: colors.surfaceSubdued }]}>
                        <Ionicons name="bookmark" size={16} color={isSelected ? colors.onSurfaceBrand : colors.muted} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                        <AppText variant="caption" style={[styles.rowTitle, isSelected && { fontWeight: '800' }]}>
                          {p.name}
                        </AppText>
                        <AppText variant="caption" color="muted" style={styles.rowDesc}>
                          {p.radiusMeters >= 1000 ? `${p.radiusMeters / 1000} km` : `${p.radiusMeters} m`} de raio
                        </AppText>
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={18} color={colors.onSurfaceBrand} />
                      ) : (
                        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                      )}
                    </Pressable>
                  </React.Fragment>
                );
              })}
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setSheetOpen(false);
                router.push('/PlacesScreen');
              }}
              style={[styles.emptyPlacesButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
              <AppText variant="caption" style={{ color: colors.ink, fontWeight: '600' }}>
                Cadastrar Casa, Trabalho ou ponto de interesse
              </AppText>
            </Pressable>
          )}
        </View>

        {/* Grupo 3: Consultar por Bairro Oficial */}
        <View style={styles.groupContainer}>
          <AppText variant="caption" color="muted" style={styles.groupHeaderLabel}>
            Consultar por Bairro Oficial
          </AppText>
          <View style={[styles.insetGroupCard, { backgroundColor: colors.surface, borderColor: colors.border, padding: spacing.sm }]}>
            <NeighborhoodPicker
              options={[]}
              value={selection.kind === 'neighborhood' ? selection.name : ''}
              onChange={(name) => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClearAreaOnly?.();
                void state.dismissPrompt();
                void state.selectNeighborhood(name);
                setSheetOpen(false);
              }}
            />
          </View>
        </View>

        {/* Grupo 4: Ajuste de Raio (se em modo raio ou GPS) */}
        {(selection.kind === 'radius' || selection.kind === 'pending-current') && (
          <View style={styles.groupContainer}>
            <AppText variant="caption" color="muted" style={styles.groupHeaderLabel}>
              Raio de Proximidade no Entorno
            </AppText>
            <View style={[styles.insetGroupCard, { backgroundColor: colors.surface, borderColor: colors.border, padding: spacing.md }]}>
              {selection.kind === 'pending-current' && (
                <AppText variant="caption" color="muted" style={{ marginBottom: spacing.xs }}>
                  Sua posição anterior não fica gravada. Atualize o GPS para consultar o entorno.
                </AppText>
              )}
              <RadiusControl
                value={selection.radiusMeters}
                onChange={(radius) => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClearAreaOnly?.();
                  void setRadius(radius);
                }}
              />
            </View>
          </View>
        )}
      </BottomSheetScrollView>
    </AppBottomSheetModal>
  );

  const shortSummary = areaOnly
    ? 'Área no mapa'
    : selection.kind === 'pending-current'
      ? 'GPS'
      : selection.kind === 'radius'
        ? activePlace?.name || selection.neighborhood?.name || 'Entorno'
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
        {renderBottomSheet()}
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
            accessibilityLabel={`Recorte territorial: ${compactSummary}. Toque para trocar local.`}
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
                size={15}
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
              <Ionicons name="chevron-down" size={12} color={colors.ink} />
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

        {renderBottomSheet()}
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

      {renderBottomSheet()}

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
  compactContainer: {
    gap: 6,
  },
  compactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactPill: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 6,
    paddingRight: 6,
    paddingVertical: 4,
    borderRadius: layout.radius.pill,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 3,
  },
  compactIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  compactChangeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: layout.radius.pill,
  },
  compactChangeText: {
    fontSize: 11,
    fontWeight: '700',
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
  sheetScroll: {
    flex: 1,
  },
  sheetScrollBody: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
  heroScopeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: layout.radius.panel,
    borderWidth: 1,
  },
  heroScopeIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScopeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroScopeTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  undoAreaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: layout.radius.pill,
  },
  groupContainer: {
    gap: 6,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  groupHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  insetGroupCard: {
    borderRadius: layout.radius.panel,
    borderWidth: 1,
    overflow: 'hidden',
  },
  insetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: spacing.sm,
  },
  insetDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
  rowIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  rowDesc: {
    fontSize: 11,
  },
  emptyPlacesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: layout.radius.panel,
    borderWidth: 1,
    borderStyle: 'dashed',
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
