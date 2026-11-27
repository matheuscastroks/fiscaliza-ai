import React, { useState } from 'react';

import { Alert, View, StyleSheet } from 'react-native';

import * as Haptics from 'expo-haptics';

import { router } from 'expo-router';
import { goBack } from '@/utils/navigation';

import { AppScreen } from '@/components/ui/AppScreen';

import { AppHeader } from '@/components/ui/AppHeader';

import { AppText } from '@/components/ui/AppText';

import { AppButton } from '@/components/ui/AppButton';

import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';

import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';

import { useTerritoryStore } from '@/stores/territoryStore';

import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';

import { useFollowStore } from '@/stores/followStore';

import { isPushConfigured } from '@/features/notifications/notificationService';

import { InsetGroup, ListRow } from '@/components/ui/ListRow';

import { useMunicipalityId } from '@/features/city/municipality';

import { AppToast } from '@/components/ui/AppToast';

import { spacing } from '@/theme';


import { useShallow } from 'zustand/react/shallow';


export default function SettingsScreen() {
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
        ? 'Eles saem da sua conta em todos os aparelhos. Os chamados continuam no 1746.'
        : 'Eles saem deste aparelho. Os chamados continuam no 1746.',
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
        <View style={styles.sectionBlock}>
          <AppText variant="sectionTitle" accessibilityRole="header">
            Bairro inicial do mapa
          </AppText>

          <NeighborhoodPicker
            options={[]}
            value={preferredNeighborhood}
            onChange={(name) => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              void setPreferredNeighborhood(name);
            }}
          />

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
          <AppText variant="sectionTitle" accessibilityRole="header">
            Notificações
          </AppText>

          <InsetGroup>
            <ListRow
              icon={notificationsActive ? 'notifications' : 'notifications-off-outline'}
              title="Avisos no celular"
              subtitle={
                !pushAvailable
                  ? 'Indisponível nesta versão'
                  : !signedIn
                    ? 'Entre na conta para receber avisos'
                    : notificationsActive
                    ? 'Ligados para seus salvos'
                    : permissionGranted
                      ? 'Toque para ligar'
                      : 'Desligados neste celular'
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

          {pushAvailable && signedIn && (
            <AppText variant="caption" color="muted" style={styles.sectionFooterText}>
              Avisamos quando um chamado salvo tiver novidade.
            </AppText>
          )}

          {notificationError && (
            <AppText color="risk" accessibilityRole="alert">
              {notificationError}
            </AppText>
          )}
        </View>

        {/* Dados guardados: apagar chamados salvos (com confirmação) */}
        <View style={styles.sectionBlock}>
          <AppText variant="sectionTitle" accessibilityRole="header">
            {signedIn ? 'Seus dados' : 'Dados neste celular'}
          </AppText>
          <InsetGroup>
            <ListRow
              icon={savedCount > 0 ? 'trash-outline' : 'bookmark-outline'}
              tone={savedCount > 0 ? 'risk' : 'neutral'}
              title={savedCount > 0 ? 'Apagar chamados salvos' : 'Chamados salvos'}
              subtitle={
                savedCount > 0
                  ? `${savedCount} ${savedCount === 1 ? 'chamado salvo' : 'chamados salvos'} ${signedIn ? 'na sua conta' : 'neste celular'}`
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
  sectionFooterText: {
    paddingHorizontal: 6,
    lineHeight: 17,
  },
});
