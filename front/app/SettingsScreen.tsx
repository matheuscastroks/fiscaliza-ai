import React, { useState } from 'react';

import { Alert, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import * as Haptics from 'expo-haptics';

import { router } from 'expo-router';
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
import { useAuthStore } from '@/stores/authStore';

import { useFollowStore } from '@/stores/followStore';

import { isPushConfigured } from '@/features/notifications/notificationService';

import { InsetGroup, ListRow } from '@/components/ui/ListRow';

import { useMunicipalityId } from '@/features/city/municipality';

import { AppToast } from '@/components/ui/AppToast';

import { useTheme, spacing, layout } from '@/theme';

import { fontSizes } from '@/theme/typography';

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
  } = useNotificationStore(useShallow((s) => ({ pushToken: s.pushToken, permissionGranted: s.permissionGranted, isLoading: s.isLoading, error: s.error, requestPermissions: s.requestPermissions })));
  const signedIn = useAuthStore((s) => Boolean(s.user));

  const municipalityId = useMunicipalityId();
  const savedCount = useFollowStore((s) => s.savedCalls.length);
  const clearSavedCalls = useFollowStore((s) => s.clearSavedCalls);
  const confirmClearSaved = () => {
    Alert.alert(
      'Apagar chamados salvos?',
      signedIn
        ? 'Eles saem da sua conta e de todos os seus aparelhos. Os chamados continuam existindo no 1746 e você pode salvá-los de novo.'
        : 'Eles serão removidos deste aparelho. Os chamados continuam existindo no 1746 e você pode salvá-los de novo.',
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

  const notificationsActive = permissionGranted && Boolean(pushToken);
  const pushAvailable = isPushConfigured();

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

          <InsetGroup>
            <ListRow
              icon={notificationsActive ? 'notifications' : 'notifications-off-outline'}
              title="Avisos no celular"
              subtitle={
                !pushAvailable
                  ? 'Ainda não funciona nesta versão do app'
                  : !signedIn
                    ? 'Entre na sua conta para receber avisos dos chamados salvos'
                    : notificationsActive
                    ? 'Avisos ligados para seus chamados salvos'
                    : permissionGranted
                      ? 'Permissão dada. Toque para ligar os avisos.'
                      : 'Avisos desligados neste celular'
              }
              trailing={
                pushAvailable && !signedIn ? (
                  <AppButton
                    title="Entrar"
                    variant="primary"
                    onPress={() => router.push('/LoginScreen')}
                  />
                ) : pushAvailable ? (
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
                ) : undefined
              }
            />
          </InsetGroup>

          <AppText variant="caption" color="muted" style={styles.sectionFooterText}>
            Avisamos quando um chamado que você salvou tiver novidade. O aviso pode demorar um pouco.
          </AppText>

          {notificationError && (
            <AppText color="risk" accessibilityRole="alert">
              {notificationError}
            </AppText>
          )}
        </View>

        {/* Dados guardados: apagar chamados salvos (com confirmação) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="phone-portrait-outline" size={layout.iconSize.sm} color={colors.muted} />
            <AppText variant="caption" style={styles.sectionHeaderText}>
              {signedIn ? 'Seus dados' : 'Dados neste celular'}
            </AppText>
          </View>
          <InsetGroup>
            <ListRow
              icon="trash-outline"
              tone="risk"
              title="Apagar chamados salvos"
              subtitle={
                savedCount > 0
                  ? `${savedCount} ${savedCount === 1 ? 'chamado salvo será removido' : 'chamados salvos serão removidos'} ${signedIn ? 'da sua conta' : 'deste aparelho'}`
                  : signedIn
                    ? 'Nenhum chamado salvo na sua conta'
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
  sectionFooterText: {
    paddingHorizontal: 6,
    lineHeight: 17,
  },
});
