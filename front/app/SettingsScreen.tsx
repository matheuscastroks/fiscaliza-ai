import React, { useState } from 'react';
import { Alert, View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { goBack } from '@/utils/navigation';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { SlidingTabs } from '@/components/ui/SlidingTabs';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { useThemeStore, isThemePreference } from '@/stores/themeStore';
import { useTerritoryStore } from '@/stores/territoryStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useFollowStore } from '@/stores/followStore';
import { isPushConfigured } from '@/features/notifications/notificationService';
import { InsetGroup, ListRow } from '@/components/ui/ListRow';
import { useMunicipalityId } from '@/features/city/municipality';
import { AppToast } from '@/components/ui/AppToast';
import { useTheme, spacing, layout } from '@/theme';
import { fontSizes } from '@/theme/typography';
import { IconTile } from '@/components/ui/IconTile';
import { useShallow } from 'zustand/react/shallow';

const appearanceOptions = [
  {
    value: 'system',
    label: 'Sistema',
    icon: 'phone-portrait-outline' as const,
  },
  { value: 'light', label: 'Claro', icon: 'sunny-outline' as const },
  { value: 'dark', label: 'Escuro', icon: 'moon-outline' as const },
];

export default function SettingsScreen() {
  const { colors } = useTheme();

  const {
    preference,
    setPreference,
    persistenceError: themeError,
  } = useThemeStore(useShallow((s) => ({ preference: s.preference, setPreference: s.setPreference, persistenceError: s.persistenceError })));

  const {
    preferredNeighborhood,
    setPreferredNeighborhood,
    persistenceError: regionError,
  } = useTerritoryStore(useShallow((s) => ({ preferredNeighborhood: s.preferredNeighborhood, setPreferredNeighborhood: s.setPreferredNeighborhood, persistenceError: s.persistenceError })));

  const {
    pushToken,
    permissionGranted,
    isLoading: notificationLoading,
    error: notificationError,
    requestPermissions,
    sendTestPush,
  } = useNotificationStore(useShallow((s) => ({ pushToken: s.pushToken, permissionGranted: s.permissionGranted, isLoading: s.isLoading, error: s.error, requestPermissions: s.requestPermissions, sendTestPush: s.sendTestPush })));

  const municipalityId = useMunicipalityId();
  const savedCount = useFollowStore((s) => s.savedCalls.length);
  const clearSavedCalls = useFollowStore((s) => s.clearSavedCalls);
  const confirmClearSaved = () => {
    Alert.alert(
      'Apagar chamados salvos?',
      'Eles serão removidos deste aparelho. Os chamados continuam existindo no 1746 e você pode salvá-los de novo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => {
            void clearSavedCalls().then((ok) =>
              setToastMessage(ok ? 'Chamados salvos apagados.' : 'Não conseguimos apagar. Tente de novo.'),
            );
          },
        },
      ],
    );
  };
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [testSending, setTestSending] = useState(false);

  const notificationsActive = permissionGranted && Boolean(pushToken);
  const pushAvailable = isPushConfigured();

  const handleTestPush = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTestSending(true);
    const success = await sendTestPush();
    setTestSending(false);
    setToastMessage(
      success
        ? 'Notificação de teste enviada com sucesso!'
        : 'Não conseguimos enviar a notificação de teste.',
    );
  };

  return (
    <AppScreen>
      <AppHeader title="Preferências" onBack={() => goBack()} />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Seção 1: Aparência do Aplicativo (Apple Segmented HIG) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="color-palette-outline" size={layout.iconSize.sm} color={colors.muted} />
            <AppText variant="caption" style={styles.sectionHeaderText}>
              Aparência do aplicativo
            </AppText>
          </View>

          <View
            style={[
              styles.insetContainer,
              { backgroundColor: colors.surface, borderColor: colors.divider },
            ]}
          >
            <SlidingTabs
              options={appearanceOptions}
              value={preference}
              label="Aparência do aplicativo"
              edgeToEdge={false}
              onChange={(value) => {
                if (isThemePreference(value)) {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  void setPreference(value);
                }
              }}
            />
          </View>

          <AppText variant="caption" color="muted" style={styles.sectionFooterText}>
            O Fiscaliza aí adapta automaticamente o contraste para modo diurno e noturno.
          </AppText>

          {themeError && (
            <AppText color="risk" accessibilityRole="alert">
              {themeError}
            </AppText>
          )}
        </View>

        {/* Seção 2: Bairro de Referência no Mapa */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="map-outline" size={layout.iconSize.sm} color={colors.muted} />
            <AppText variant="caption" style={styles.sectionHeaderText}>
              Bairro de referência no mapa
            </AppText>
          </View>

          <View
            style={[
              styles.insetContainer,
              { backgroundColor: colors.surface, borderColor: colors.divider },
            ]}
          >
            <NeighborhoodPicker
              options={[]}
              value={preferredNeighborhood}
              onChange={(name) => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                void setPreferredNeighborhood(name);
              }}
            />
          </View>

          <AppText variant="caption" color="muted" style={styles.sectionFooterText}>
            Escolha um bairro para o mapa já abrir nele.
          </AppText>

          {regionError && (
            <AppText color="risk" accessibilityRole="alert">
              {regionError}
            </AppText>
          )}
        </View>

        {/* Seção 3: Notificações e Alertas do 1746 */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="notifications-outline" size={layout.iconSize.sm} color={colors.muted} />
            <AppText variant="caption" style={styles.sectionHeaderText} accessibilityLabel="Avisos">
              Notificações
            </AppText>
          </View>

          <View
            style={[
              styles.insetTable,
              { backgroundColor: colors.surface, borderColor: colors.divider },
            ]}
          >
            {/* Linha 1: Status das Notificações */}
            <View style={styles.tableRow}>
              <View
                style={[
                  styles.iconSquircle,
                  {
                    backgroundColor: notificationsActive
                      ? colors.completedSurface
                      : colors.surfaceSubdued,
                  },
                ]}
              >
                <Ionicons
                  name={notificationsActive ? 'notifications' : 'notifications-off-outline'}
                  size={layout.iconSize.md}
                  color={notificationsActive ? colors.completed : colors.primary}
                />
              </View>

              <View style={styles.tableRowContent}>
                <AppText variant="label">Avisos no celular</AppText>
                <AppText variant="caption" color="muted">
                  {!pushAvailable
                    ? 'Ainda não funciona nesta versão do app'
                    : notificationsActive
                    ? 'Avisos ligados para seus chamados salvos'
                    : permissionGranted
                      ? 'Permissão dada. Toque para ligar os avisos.'
                      : 'Avisos desligados neste celular'}
                </AppText>
              </View>

              {pushAvailable && (
              <AppButton
                title={notificationsActive ? 'Ligados' : permissionGranted ? 'Tentar de novo' : 'Ligar'}
                variant={notificationsActive ? 'secondary' : 'primary'}
                disabled={notificationLoading || notificationsActive}
                loading={notificationLoading}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  void requestPermissions(municipalityId);
                }}
              />
              )}
            </View>

            {/* Linha 2: Disparo de Notificação de Teste (quando permitido) */}
            {__DEV__ && permissionGranted && (
              <>
                <View style={[styles.tableDivider, { backgroundColor: colors.divider }]} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Testar notificação no celular"
                  disabled={testSending || !pushToken}
                  onPress={handleTestPush}
                  style={({ pressed }) => [
                    styles.tableRow,
                    pressed && { backgroundColor: colors.surfaceSubdued },
                    (testSending || !pushToken) && { opacity: 0.6 },
                  ]}
                >
                  <IconTile icon="paper-plane-outline" />

                  <View style={styles.tableRowContent}>
                    <AppText variant="label">Testar notificação no celular</AppText>
                    <AppText variant="caption" color="muted">
                      Envia um aviso de teste (só em desenvolvimento)
                    </AppText>
                  </View>

                  <Ionicons name="send-outline" size={layout.iconSize.sm} color={colors.primary} />
                </Pressable>
              </>
            )}
          </View>

          <AppText variant="caption" color="muted" style={styles.sectionFooterText}>
            Avisamos quando um chamado que você salvou tiver novidade. O aviso pode demorar um pouco.
          </AppText>

          {notificationError && (
            <AppText color="risk" accessibilityRole="alert">
              {notificationError}
            </AppText>
          )}
        </View>

        {/* Dados neste celular: apagar chamados salvos (com confirmação) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="phone-portrait-outline" size={layout.iconSize.sm} color={colors.muted} />
            <AppText variant="caption" style={styles.sectionHeaderText}>
              Dados neste celular
            </AppText>
          </View>
          <InsetGroup>
            <ListRow
              icon="trash-outline"
              tone="risk"
              title="Apagar chamados salvos"
              subtitle={
                savedCount > 0
                  ? `${savedCount} ${savedCount === 1 ? 'chamado salvo será removido' : 'chamados salvos serão removidos'} deste aparelho`
                  : 'Nenhum chamado salvo neste celular'
              }
              onPress={savedCount > 0 ? confirmClearSaved : undefined}
            />
          </InsetGroup>
        </View>
      </KeyboardAwareScrollView>

      <AppToast
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.contentPadding,
    paddingTop: spacing.xs,
    paddingBottom: 140,
    gap: spacing.lg,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
  },
  insetContainer: {
    borderRadius: layout.radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm,
  },
  insetTable: {
    borderRadius: layout.radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 56,
  },
  tableDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 54,
  },
  iconSquircle: {
    width: 34,
    height: 34,
    borderRadius: layout.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableRowContent: {
    flex: 1,
    gap: 2,
    paddingRight: 6,
  },
  sectionFooterText: {
    paddingHorizontal: 6,
    lineHeight: 17,
  },
});
