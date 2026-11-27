import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import type { ElevationTokens } from '@/theme/elevation';
import { spacing, layout } from '@/theme';
import {
  AppBottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@/components/ui/AppBottomSheetModal';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useAuthStore } from '@/stores/authStore';
import { formatPostalCode } from '@/services/postalCode';
import { usePostalCodeFlow } from '@/features/profile/usePostalCodeFlow';
import { fontSizes } from '@/theme/typography';

export interface PostalCodeSheetProps {
  visible: boolean;
  onClose: () => void;
  currentPostalCode?: string | null;
  currentNeighborhood?: string | null;
}

export function PostalCodeSheet({
  visible,
  onClose,
  currentPostalCode,
  currentNeighborhood,
}: PostalCodeSheetProps) {
  const { colors, elevation, mode } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [bodyHeight, setBodyHeight] = useState(0);
  const sheetHeight = headerHeight && bodyHeight
    ? Math.ceil(Math.min(height - insets.top - spacing.sm, headerHeight + bodyHeight + 30))
    : '55%';

  const user = useAuthStore((s) => s.user);
  const flow = usePostalCodeFlow(
    currentPostalCode ? formatPostalCode(currentPostalCode) : '',
  );
  const { postalCode, digits, lookup, busy, saving, error, reset } = flow;

  // Sincroniza CEP inicial ao abrir
  useEffect(() => {
    if (visible) reset(currentPostalCode ? formatPostalCode(currentPostalCode) : '');
  }, [visible, currentPostalCode, reset]);

  const handleSearch = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void flow.search();
  };

  const handleConfirm = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (await flow.confirm()) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    }
  };

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={() => {
        if (!busy && !saving) onClose();
      }}
      title="Meu CEP"
      snapPoints={[sheetHeight]}
      onHeaderHeightChange={setHeaderHeight}
      keyboardBehavior="fillParent"
      keyboardBlurBehavior="restore"
      enablePanDownToClose={!busy && !saving}
      showHeader={true}
    >
      <BottomSheetScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
        onContentSizeChange={(_, contentHeight) => setBodyHeight(contentHeight)}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!user ? (
          /* Estado Não Conectado: Apelo para Login */
          <View style={styles.guestCard}>
            <View style={{ gap: 4 }}>
              <AppText variant="body" color="muted">
                Entre na sua conta para guardar seu CEP no perfil.
              </AppText>
            </View>
            <AppButton
              title="Entrar ou criar conta"
              onPress={() => {
                onClose();
                router.push('/LoginScreen');
              }}
            />
          </View>
        ) : (
          /* Estado Conectado: Formulário Rápido de CEP */
          <View style={{ gap: spacing.md }}>
            <View style={styles.headerInfo}>
              <AppText variant="caption" color="muted">
                Digite o CEP de onde você mora:
              </AppText>
            </View>

            {/* Input de CEP com estilo Inset */}
            <View
              style={[
                styles.inputWrapper,
                elevation.recessed,
                {
                  backgroundColor: colors.surfaceRecessed,
                },
              ]}
            >
              <Ionicons name="search-outline" size={layout.iconSize.md} color={colors.muted} />
              <BottomSheetTextInput
                accessibilityLabel="CEP residencial"
                autoComplete="postal-code"
                value={postalCode}
                placeholder="Digite seu CEP (00000-000)"
                placeholderTextColor={colors.subtle}
                keyboardType="number-pad"
                keyboardAppearance={mode}
                maxLength={9}
                editable={!busy && !saving}
                onChangeText={(value) => flow.reset(formatPostalCode(value))}
                onSubmitEditing={() => {
                  if (digits.length === 8) void handleSearch();
                }}
                style={[styles.textInput, { color: colors.ink }]}
              />
              {postalCode.length > 0 && !busy && !saving && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Limpar CEP"
                  onPress={() => flow.reset('')}
                  hitSlop={8}
                >
                  <Ionicons
                    name="close-circle"
                    size={layout.iconSize.md}
                    color={colors.muted}
                  />
                </Pressable>
              )}
            </View>

            {/* Botão de Busca */}
            {!lookup && (
              <AppButton
                title="Consultar CEP"
                loading={busy}
                disabled={digits.length !== 8 || saving}
                icon={<Ionicons name="search" size={layout.iconSize.sm} color={colors.onAccent} />}
                onPress={() => void handleSearch()}
              />
            )}

            {/* Resultado Encontrado (Hero Card de Confirmação) */}
            {lookup && (
              <View
                style={[
                  styles.resultCard,
                  elevation.subtle,
                  {
                    backgroundColor: colors.surfaceRaised,
                  },
                ]}
              >
                <View style={styles.resultBadgeRow}>
                  <View
                    style={[
                      styles.resultBadge,
                      { backgroundColor: colors.completedSurface },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={layout.iconSize.sm}
                      color={colors.completed}
                    />
                    <AppText
                      variant="caption"
                      style={[styles.resultBadgeText, { color: colors.completed }]}
                    >
                      Endereço encontrado
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.cepPill,
                      { backgroundColor: colors.surfaceSubdued },
                    ]}
                  >
                    <AppText variant="caption" style={styles.cepPillText}>
                      CEP {lookup.postalCode}
                    </AppText>
                  </View>
                </View>

                <View style={{ gap: 2 }}>
                  <AppText variant="sectionTitle" style={styles.neighborhoodTitle}>
                    {lookup.neighborhood || 'Rio de Janeiro'}
                  </AppText>
                  <AppText variant="body" color="muted">
                    {lookup.street ? `${lookup.street} · ` : ''}Rio de Janeiro, RJ
                  </AppText>
                </View>

                <View style={styles.resultActions}>
                  <AppButton
                    title="Confirmar este CEP"
                    variant="primary"
                    loading={saving}
                    disabled={busy}
                    icon={
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={layout.iconSize.md}
                        color={colors.onAccent}
                      />
                    }
                    onPress={() => void handleConfirm()}
                  />
                  <AppButton
                    title="Digitar outro CEP"
                    variant="quiet"
                    disabled={saving}
                    onPress={() => flow.reset('')}
                  />
                </View>
              </View>
            )}

            {/* Alerta de Erro */}
            {error !== '' && (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: colors.riskSurface,
                    borderColor: colors.risk,
                  },
                ]}
                accessibilityRole="alert"
              >
                <Ionicons name="alert-circle" size={layout.iconSize.sm} color={colors.risk} />
                <AppText variant="caption" color="risk" style={styles.flex}>
                  {error}
                </AppText>
              </View>
            )}
          </View>
        )}
      </BottomSheetScrollView>
    </AppBottomSheetModal>
  );
}

const createStyles = (colors: ThemeColors, _elevation?: ElevationTokens) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: spacing.contentPadding,
      paddingTop: spacing.xs,
      gap: spacing.md,
    },
    guestCard: {
      gap: spacing.md,
    },
    headerInfo: {
      gap: 2,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: layout.radius.sm,
      paddingHorizontal: 14,
      minHeight: 52,
      gap: 10,
    },
    textInput: {
      flex: 1,
      fontSize: fontSizes.body,
      fontWeight: '600',
      paddingVertical: 10,
    },
    resultCard: {
      borderRadius: layout.radius.panel,
      padding: spacing.md,
      gap: spacing.sm,
    },
    resultBadgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    resultBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: layout.radius.control,
    },
    resultBadgeText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
    },
    cepPill: {
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: layout.radius.control,
    },
    cepPillText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
      color: colors.ink,
    },
    neighborhoodTitle: {
      fontSize: fontSizes.sectionTitle,
      fontWeight: '600',
    },
    resultActions: {
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: spacing.sm,
      borderRadius: layout.radius.sm,
      borderWidth: layout.borderWidth.focus,
    },
    flex: {
      flex: 1,
      minWidth: 0,
    },
  });
