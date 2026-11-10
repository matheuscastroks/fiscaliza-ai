import { useState } from 'react';
import { router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { PlaceEditor } from '@/features/places/PlaceEditor';
import { usePlacesStore } from '@/stores/placesStore';
import { goBack } from '@/utils/navigation';
import { spacing, layout, useTheme } from '@/theme';
import { formatRadius, getPlaceIcon } from '@/features/places/placeDisplay';

export default function PlacesScreen() {
  const { colors, isDark } = useTheme();
  const state = usePlacesStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  return (
    <AppScreen>
      <AppHeader title="Meus lugares" onBack={() => goBack()} />
      <KeyboardAwareScrollView
        contentContainerStyle={{
          padding: spacing.contentPadding,
          paddingBottom: 120,
          gap: spacing.lg,
        }}
      >
        <AppText color="muted">
          Guarde lugares como Casa ou Trabalho para ver rápido os chamados perto deles. Os dados ficam salvos localmente neste aparelho.
        </AppText>

        {!state.hydrated ? (
          <AppText color="muted">Carregando lugares…</AppText>
        ) : editing !== null ? (
          <PlaceEditor
            key={editing}
            initialPlace={state.places.find((p) => p.id === editing)}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <>
            <AppButton
              title="Adicionar novo lugar"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditing('new');
              }}
            />

            {!state.places.length && (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Ionicons name="location-outline" size={layout.iconSize.lg} color={colors.muted} />
                <AppText variant="sectionTitle" style={{ textAlign: 'center' }}>
                  Nenhum lugar cadastrado
                </AppText>
                <AppText color="muted" style={{ textAlign: 'center' }}>
                  Salve um lugar para acompanhar iluminação, buracos e limpeza perto de casa ou do trabalho.
                </AppText>
              </View>
            )}

            {state.places.map((place) => {
              const icon = getPlaceIcon(place.name);
              const radiusLabel = formatRadius(place.radiusMeters);
              const locationDesc =
                place.addressLabel || place.neighborhood?.name || 'Ponto confirmado no mapa';

              return (
                <View
                  key={place.id}
                  style={[
                    styles.placeCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: isDark ? colors.surfaceSubdued : colors.surfaceSubdued },
                      ]}
                    >
                      <Ionicons name={icon} size={layout.iconSize.md} color={colors.onSurfaceBrand} />
                    </View>
                    <View style={styles.headerInfo}>
                      <AppText variant="sectionTitle" numberOfLines={1}>
                        {place.name}
                      </AppText>
                      <AppText variant="caption" color="muted" numberOfLines={1}>
                        {locationDesc}
                      </AppText>
                    </View>
                    <View
                      style={[
                        styles.radiusBadge,
                        { backgroundColor: isDark ? colors.surfaceSubdued : colors.surfaceSubdued, borderColor: colors.border },
                      ]}
                    >
                      <AppText variant="caption" style={{ fontWeight: '600', color: colors.onSurfaceBrand }}>
                        {radiusLabel}
                      </AppText>
                    </View>
                  </View>

                  <AppButton
                    title="Ver chamados perto daqui"
                    variant="secondary"
                    disabled={state.busy}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      void state.selectPlace(place.id).then((ok) => {
                        if (ok) router.navigate('/(tabs)/TerritoryScreen');
                      });
                    }}
                  />

                  <View style={styles.actionsRow}>
                    <View style={styles.flex}>
                      <AppButton
                        title="Editar"
                        variant="secondary"
                        disabled={state.busy}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setEditing(place.id);
                        }}
                      />
                    </View>
                    <View style={styles.flex}>
                      <AppButton
                        title="Excluir"
                        variant="secondary"
                        disabled={state.busy}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setRemoving(place.id);
                        }}
                      />
                    </View>
                  </View>

                  {removing === place.id && (
                    <View
                      style={[
                        styles.removalBox,
                        { backgroundColor: isDark ? colors.surfaceSubdued : colors.surfaceSubdued, borderColor: colors.border },
                      ]}
                    >
                      <AppText variant="caption">
                        Excluir {place.name}? Se estiver em uso, o mapa volta a mostrar a cidade toda.
                      </AppText>
                      <View style={styles.actionsRow}>
                        <View style={styles.flex}>
                          <AppButton
                            title="Confirmar exclusão"
                            variant="destructive"
                            loading={state.busy}
                            onPress={() => {
                              void state.deletePlace(place.id).then((ok) => {
                                if (ok) setRemoving(null);
                              });
                            }}
                          />
                        </View>
                        <View style={styles.flex}>
                          <AppButton
                            title="Cancelar"
                            variant="secondary"
                            disabled={state.busy}
                            onPress={() => setRemoving(null)}
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {state.error && (
          <AppText color="risk" accessibilityRole="alert">
            {state.error}
          </AppText>
        )}
      </KeyboardAwareScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  placeCard: {
    borderRadius: layout.radius.card,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: layout.radius.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  radiusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: layout.radius.pill,
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  removalBox: {
    padding: spacing.md,
    borderRadius: layout.radius.card,
    borderWidth: 1,
    gap: spacing.sm,
  },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: layout.radius.card,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
});
