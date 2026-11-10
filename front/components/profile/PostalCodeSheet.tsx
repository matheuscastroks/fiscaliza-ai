import React, { useEffect } from 'react';
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
  const { colors, mode } = useTheme();
  const styles = useThemedStyles(createStyles);

  const user = useAuthStore((s) => s.user);
  const flow = usePostalCodeFlow(
    currentPostalCode ? formatPostalCode(currentPostalCode) : '',
  );
  const { postalCode, digits, lookup, busy, saving, error } = flow;

  // Sincroniza CEP inicial ao abrir
  useEffect(() => {
    if (visible) flow.reset(currentPostalCode ? formatPostalCode(currentPostalCode) : '');
  }, [visible, currentPostalCode]);

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
      title="Meu CEP Residencial"
      snapPoints={['65%', '90%']}
      enablePanDownToClose={!busy && !saving}
      showHeader={true}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!user ? (
          /* Estado Não Conectado: Apelo para Login */
          <View style={styles.guestCard}>
            <View
              style={[
                styles.iconSquircle,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <Ionicons name="location" size={layout.iconSize.lg} color={colors.primary} />
            </View>
            <View style={{ gap: 4 }}>
              <AppText variant="sectionTitle">
                Vincule seu CEP carioca
              </AppText>
              <AppText variant="body" color="muted">
                Acesse sua conta para registrar seu domicílio cívico, acompanhar chamados do seu bairro e receber notificações personalizadas.
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
                Informe seu CEP residencial no município do Rio de Janeiro:
              </AppText>
            </View>

            {/* Input de CEP com estilo Inset */}
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceSubdued,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="search-outline" size={layout.iconSize.md} color={colors.muted} />
              <BottomSheetTextInput
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
                  {
                    backgroundColor: colors.surfaceSubdued,
                    borderColor: colors.divider,
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
                      Domicílio encontrado
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
                style={[styles.errorBox, { borderColor: colors.risk }]}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: spacing.contentPadding,
      paddingTop: spacing.xs,
      paddingBottom: 40,
      gap: spacing.md,
    },
    guestCard: {
      alignItems: 'center',
      textAlign: 'center',
      paddingVertical: spacing.lg,
      gap: spacing.md,
    },
    iconSquircle: {
      width: 52,
      height: 52,
      borderRadius: layout.radius.panel,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerInfo: {
      gap: 2,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: layout.radius.sm,
      borderWidth: 1,
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
      padding: spacing.md,
      gap: spacing.sm,
    },
    resultBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    resultBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: layout.radius.pill,
    },
    resultBadgeText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
    },
    cepPill: {
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: layout.radius.pill,
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
      backgroundColor: colors.surface,
      borderWidth: 1,
    },
    flex: {
      flex: 1,
      minWidth: 0,
    },
  });
