import React from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/ui/AppText';
import { AppBottomSheetModal, BottomSheetScrollView } from '@/components/ui/AppBottomSheetModal';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { usePlacesStore } from '@/stores/placesStore';
import { useDeviceLocation } from './useDeviceLocation';
import { RadiusControl } from './RadiusControl';
import { layout, spacing, useTheme } from '@/theme';
import type { SavedPlace, TerritorySelection } from './types';
import { styles } from './PlaceSelector.styles';

type PlacesState = ReturnType<typeof usePlacesStore.getState>;

/** Conteúdo do bottom sheet "Trocar Local": recorte atual, ações rápidas, lugares, bairros e raio. */
export function PlaceSelectorSheet({ sheetOpen, setSheetOpen, state, selection, places, setRadius, device, activePlace, title, subtitle, iconName, areaOnly, onClearAreaOnly }: {
  sheetOpen: boolean;
  setSheetOpen: (value: boolean) => void;
  state: PlacesState;
  selection: TerritorySelection;
  places: SavedPlace[];
  setRadius: PlacesState['setRadius'];
  device: ReturnType<typeof useDeviceLocation>;
  activePlace: SavedPlace | null | undefined;
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  areaOnly: boolean;
  onClearAreaOnly: (() => void) | undefined;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  return (
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
        <View style={styles.filterFormContainer}>
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
              <Ionicons name={iconName} size={layout.iconSize.md} color={colors.onSurfaceBrand} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
              <AppText variant="caption" color="muted" style={styles.heroScopeLabel}>
                Área em uso
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
                accessibilityLabel="Voltar à área salvo"
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
                <Ionicons name="arrow-undo" size={layout.iconSize.sm} color={colors.onAccent} />
                <AppText variant="caption" style={{ color: colors.onAccent, fontWeight: '600' }}>
                  Voltar
                </AppText>
              </Pressable>
            )}
          </View>

          {/* Seção 1: Atalhos */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="flash-outline" size={layout.iconSize.sm} color={colors.accent} />
              <AppText variant="caption" color="muted" style={styles.sectionHeaderTitle}>
                Atalhos
              </AppText>
            </View>
            <View style={[styles.insetGroupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Linha GPS */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  selection.kind === 'radius' && selection.source === 'current'
                    ? 'Atualizar minha localização'
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
                <View style={[styles.rowIconBadge, { backgroundColor: colors.infoSurface }]}>
                  <Ionicons name="navigate" size={layout.iconSize.sm} color={colors.info} />
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                  <AppText variant="caption" style={styles.rowTitle}>
                    {selection.kind === 'radius' && selection.source === 'current'
                      ? 'Atualizar minha localização'
                      : 'Usar minha localização'}
                  </AppText>
                  <AppText variant="caption" color="muted" style={styles.rowDesc}>
                    Mostra o que está perto de você agora
                  </AppText>
                </View>
                {device.busy ? (
                  <AppText variant="caption" color="muted">Buscando...</AppText>
                ) : selection.kind === 'radius' && selection.source === 'current' ? (
                  <Ionicons name="checkmark-circle" size={layout.iconSize.md} color={colors.info} />
                ) : (
                  <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.muted} />
                )}
              </Pressable>

              <View style={[styles.insetDivider, { backgroundColor: colors.divider }]} />

              {/* Linha Todo o Município */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver a cidade toda do Rio de Janeiro"
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
                <View style={[styles.rowIconBadge, { backgroundColor: colors.completedSurface }]}>
                  <Ionicons name="globe-outline" size={layout.iconSize.sm} color={colors.completed} />
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                  <AppText variant="caption" style={styles.rowTitle}>
                    A cidade toda
                  </AppText>
                  <AppText variant="caption" color="muted" style={styles.rowDesc}>
                    Ver chamados de todo o Rio de Janeiro
                  </AppText>
                </View>
                {selection.kind === 'municipality' && !areaOnly ? (
                  <Ionicons name="checkmark-circle" size={layout.iconSize.md} color={colors.completed} />
                ) : (
                  <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.muted} />
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
                    <View style={[styles.rowIconBadge, { backgroundColor: colors.attentionSurface }]}>
                      <Ionicons name="business" size={layout.iconSize.sm} color={colors.attention} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                      <AppText variant="caption" style={styles.rowTitle}>
                        Ver todo o bairro {selection.neighborhood.name}
                      </AppText>
                      <AppText variant="caption" color="muted" style={styles.rowDesc}>
                        Expandir a busca para o bairro completo
                      </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.muted} />
                  </Pressable>
                </>
              )}
            </View>
          </View>

          <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />

          {/* Seção 2: Meus Meus lugares */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRowBetween}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="bookmark-outline" size={layout.iconSize.sm} color={colors.accent} />
                <AppText variant="caption" color="muted" style={styles.sectionHeaderTitle}>
                  Meus lugares
                </AppText>
              </View>
              <Pressable
                onPress={() => {
                  setSheetOpen(false);
                  router.push('/PlacesScreen');
                }}
                hitSlop={8}
              >
                <AppText variant="caption" style={{ color: colors.accent, fontWeight: '600' }}>
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
                          <Ionicons name="bookmark" size={layout.iconSize.sm} color={isSelected ? colors.onSurfaceBrand : colors.muted} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                          <AppText variant="caption" style={[styles.rowTitle, isSelected && { fontWeight: '600' }]}>
                            {p.name}
                          </AppText>
                          <AppText variant="caption" color="muted" style={styles.rowDesc}>
                            {p.radiusMeters >= 1000 ? `${p.radiusMeters / 1000} km` : `${p.radiusMeters} m`} de distância
                          </AppText>
                        </View>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={layout.iconSize.md} color={colors.onSurfaceBrand} />
                        ) : (
                          <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.muted} />
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
                <Ionicons name="add-circle-outline" size={layout.iconSize.sm} color={colors.accent} />
                <AppText variant="caption" style={{ color: colors.ink, fontWeight: '600' }}>
                  Cadastrar Casa, Trabalho ou ponto de interesse
                </AppText>
              </Pressable>
            )}
          </View>

          <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />

          {/* Seção 3: Escolher um bairro */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="business-outline" size={layout.iconSize.sm} color={colors.accent} />
              <AppText variant="caption" color="muted" style={styles.sectionHeaderTitle}>
                Escolher um bairro
              </AppText>
            </View>
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

          {/* Seção 4: Ajuste de Raio (se em modo raio ou GPS) */}
          {(selection.kind === 'radius' || selection.kind === 'pending-current') && (
            <>
              <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />
              <View style={styles.filterSection}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="radio-outline" size={layout.iconSize.sm} color={colors.accent} />
                  <AppText variant="caption" color="muted" style={styles.sectionHeaderTitle}>
                    Até onde olhar
                  </AppText>
                </View>
                {selection.kind === 'pending-current' && (
                  <AppText variant="caption" color="muted" style={{ marginBottom: spacing.xs }}>
                    Sua localização antiga não fica guardada. Atualize para ver o que está perto de você.
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
            </>
          )}
        </View>
      </BottomSheetScrollView>
    </AppBottomSheetModal>);
}
