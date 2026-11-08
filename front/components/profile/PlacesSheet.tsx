import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { spacing, layout } from '@/theme';
import {
  AppBottomSheetModal,
  BottomSheetScrollView,
} from '@/components/ui/AppBottomSheetModal';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { PlaceEditor } from '@/features/places/PlaceEditor';
import { usePlacesStore } from '@/stores/placesStore';

function getPlaceIcon(name: string): keyof typeof Ionicons.glyphMap {
  const lower = name.toLowerCase();
  if (lower.includes('casa') || lower.includes('lar') || lower.includes('ap'))
    return 'home-outline';
  if (
    lower.includes('trab') ||
    lower.includes('serv') ||
    lower.includes('escrit')
  )
    return 'briefcase-outline';
  if (
    lower.includes('escola') ||
    lower.includes('facul') ||
    lower.includes('univ')
  )
    return 'school-outline';
  return 'location-outline';
}

function formatRadius(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  const km = meters / 1000;
  return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
}

export interface PlacesSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function PlacesSheet({ visible, onClose }: PlacesSheetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const state = usePlacesStore();
  const places = state.places;

  const [editing, setEditing] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleSelectPlaceOnMap = async (placeId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await state.selectPlace(placeId);
    if (ok) {
      onClose();
      router.navigate('/(tabs)/TerritoryScreen');
    }
  };

  const handleRemovePlace = async (placeId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await state.deletePlace(placeId);
    setRemovingId(null);
  };

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={() => {
        if (!editing) onClose();
      }}
      title={editing !== null ? (editing === 'new' ? 'Novo Lugar' : 'Editar Lugar') : 'Meus Lugares'}
      snapPoints={['75%', '92%']}
      enablePanDownToClose={editing === null}
      showHeader={true}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {editing !== null ? (
          /* Editor de Lugar (Novo ou Edição) */
          <PlaceEditor
            key={editing}
            initialPlace={places.find((p) => p.id === editing)}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        ) : (
          /* Listagem de Lugares Cadastrados */
          <View style={{ gap: spacing.md }}>
            <View style={styles.headerInfo}>
              <AppText variant="caption" color="muted">
                Guarde pontos como Casa e Trabalho para consultar com 1 toque os chamados do 1746 no seu entorno.
              </AppText>
            </View>

            <AppButton
              title="Adicionar novo lugar"
              icon={<Ionicons name="add-circle-outline" size={18} color={colors.onAccent} />}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditing('new');
              }}
            />

            {places.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: colors.surfaceSubdued,
                    borderColor: colors.divider,
                  },
                ]}
              >
                <Ionicons name="location-outline" size={32} color={colors.muted} />
                <AppText variant="sectionTitle" style={{ textAlign: 'center' }}>
                  Nenhum lugar cadastrado
                </AppText>
                <AppText variant="caption" color="muted" style={{ textAlign: 'center', lineHeight: 18 }}>
                  Cadastre um local com raio de monitoramento para acompanhar iluminação, conservação e lixo no seu quarteirão.
                </AppText>
              </View>
            ) : (
              <View style={styles.placesList}>
                {places.map((place) => {
                  const icon = getPlaceIcon(place.name);
                  const radiusLabel = formatRadius(place.radiusMeters);
                  const locationDesc =
                    place.addressLabel ||
                    place.neighborhood?.name ||
                    'Ponto de referência no mapa';

                  const isConfirmingDelete = removingId === place.id;

                  return (
                    <View
                      key={place.id}
                      style={[
                        styles.placeCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.divider,
                        },
                      ]}
                    >
                      {/* Cabeçalho do Card */}
                      <View style={styles.cardHeader}>
                        <View
                          style={[
                            styles.iconSquircle,
                            { backgroundColor: colors.primaryContainer },
                          ]}
                        >
                          <Ionicons
                            name={icon}
                            size={18}
                            color={colors.primary}
                          />
                        </View>
                        <View style={styles.cardHeaderInfo}>
                          <AppText variant="label" numberOfLines={1}>
                            {place.name}
                          </AppText>
                          <AppText variant="caption" color="muted" numberOfLines={1}>
                            {locationDesc}
                          </AppText>
                        </View>
                        <View
                          style={[
                            styles.radiusBadge,
                            { backgroundColor: colors.surfaceSubdued },
                          ]}
                        >
                          <AppText variant="caption" style={styles.radiusBadgeText}>
                            {radiusLabel}
                          </AppText>
                        </View>
                      </View>

                      {/* Botão Primário: Consultar no Mapa */}
                      <AppButton
                        title="Consultar entorno no mapa"
                        variant="secondary"
                        icon={<Ionicons name="map-outline" size={15} color={colors.ink} />}
                        onPress={() => void handleSelectPlaceOnMap(place.id)}
                      />

                      {/* Confirmação de Exclusão ou Ações */}
                      {isConfirmingDelete ? (
                        <View style={styles.deleteConfirmBox}>
                          <AppText variant="caption" color="risk" style={{ fontWeight: '600' }}>
                            Deseja remover este lugar?
                          </AppText>
                          <View style={styles.confirmActionsRow}>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Confirmar exclusão"
                              onPress={() => void handleRemovePlace(place.id)}
                              style={[
                                styles.actionBtnPill,
                                { backgroundColor: colors.riskSurface },
                              ]}
                            >
                              <AppText
                                variant="caption"
                                style={{ color: colors.risk, fontWeight: '700' }}
                              >
                                Sim, remover
                              </AppText>
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Cancelar exclusão"
                              onPress={() => setRemovingId(null)}
                              style={[
                                styles.actionBtnPill,
                                { backgroundColor: colors.surfaceSubdued },
                              ]}
                            >
                              <AppText variant="caption" color="muted">
                                Cancelar
                              </AppText>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.actionsRow}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Editar ${place.name}`}
                            onPress={() => {
                              void Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light,
                              );
                              setEditing(place.id);
                            }}
                            style={styles.actionLink}
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={14}
                              color={colors.primary}
                            />
                            <AppText
                              variant="caption"
                              style={{ color: colors.primary, fontWeight: '600' }}
                            >
                              Editar
                            </AppText>
                          </Pressable>

                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Remover ${place.name}`}
                            onPress={() => {
                              void Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light,
                              );
                              setRemovingId(place.id);
                            }}
                            style={styles.actionLink}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={14}
                              color={colors.muted}
                            />
                            <AppText variant="caption" color="muted">
                              Remover
                            </AppText>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </BottomSheetScrollView>
    </AppBottomSheetModal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: spacing.contentPadding,
      paddingTop: spacing.xs,
      paddingBottom: 40,
      gap: spacing.md,
    },
    headerInfo: {
      gap: 2,
    },
    emptyCard: {
      borderRadius: layout.radius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    placesList: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    placeCard: {
      borderRadius: layout.radius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconSquircle: {
      width: 34,
      height: 34,
      borderRadius: layout.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardHeaderInfo: {
      flex: 1,
      gap: 2,
    },
    radiusBadge: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: layout.radius.pill,
    },
    radiusBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 16,
      paddingTop: 4,
    },
    actionLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 6,
    },
    deleteConfirmBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 4,
      gap: 8,
      flexWrap: 'wrap',
    },
    confirmActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionBtnPill: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: layout.radius.pill,
    },
  });
