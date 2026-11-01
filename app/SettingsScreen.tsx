import { useState } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { BottomSheet, RNHostView } from '@expo/ui';
import { router } from 'expo-router';
import { goBack } from '@/utils/navigation';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { SlidingTabs } from '@/components/ui/SlidingTabs';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore, isThemePreference } from '@/stores/themeStore';
import { useTerritoryStore } from '@/stores/territoryStore';
import { useFollowStore } from '@/stores/followStore';
import { spacing, useTheme } from '@/theme';
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
  const { width } = useWindowDimensions();
  const user = useAuthStore((s) => s.user);
  const {
    preference,
    setPreference,
    persistenceError: themeError,
  } = useThemeStore();
  const {
    preferredNeighborhood,
    setPreferredNeighborhood,
    persistenceError: regionError,
  } = useTerritoryStore();
  const {
    savedCalls,
    clearSavedCalls,
    persistenceError: savedError,
    busy,
    hydrated,
  } = useFollowStore();
  const [confirm, setConfirm] = useState(false);
  return (
    <AppScreen>
      <AppHeader title="Preferências" onBack={() => goBack()} />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.contentPadding,
          paddingBottom: 120,
          gap: spacing.xl,
        }}
      >
        <View style={{ gap: spacing.md }}>
          <AppText variant="sectionTitle">Minha região</AppText>
          <AppText color="muted">
            Rio de Janeiro. Escolha um bairro para ter um atalho na Home.
          </AppText>
          <NeighborhoodPicker
            options={[]}
            value={preferredNeighborhood}
            onChange={(name) => {
              void setPreferredNeighborhood(name);
            }}
          />
          {regionError && (
            <AppText color="risk" accessibilityRole="alert">
              {regionError}
            </AppText>
          )}
        </View>
        <View style={{ gap: spacing.md }}>
          <AppText variant="sectionTitle">Aparência</AppText>
          <SlidingTabs
            options={appearanceOptions}
            value={preference}
            label="Aparência do aplicativo"
            edgeToEdge={false}
            onChange={(value) => {
              if (isThemePreference(value)) void setPreference(value);
            }}
          />
          {themeError && (
            <AppText color="risk" accessibilityRole="alert">
              {themeError}
            </AppText>
          )}
        </View>
        <View style={{ gap: spacing.md }}>
          <AppText variant="sectionTitle">Chamados salvos na conta</AppText>
          <AppText color="muted">
            Seus chamados acompanhados ficam vinculados à sua conta (
            {user?.email || 'usuário conectado'}) neste município.
          </AppText>
          <AppText variant="caption" color="muted">
            {hydrated
              ? `${savedCalls.length} chamados salvos na sua conta`
              : 'Carregando salvos…'}
          </AppText>
          <AppButton
            title="Limpar salvos da minha conta"
            variant="destructive"
            disabled={!hydrated || !savedCalls.length || busy}
            onPress={() => setConfirm(true)}
          />
          {savedError && (
            <AppText color="risk" accessibilityRole="alert">
              {savedError}
            </AppText>
          )}
        </View>
        <View style={{ gap: spacing.md }}>
          <AppText variant="sectionTitle">Ajuda e acessibilidade</AppText>
          <AppText color="muted">
            O texto acompanha o tamanho definido no aparelho. Fonte e leitor de
            tela podem ser ajustados no sistema.
          </AppText>
          <AppButton
            title="Rever introdução ao app"
            variant="secondary"
            onPress={() => router.push('/OnboardingScreen')}
          />
          <AppButton
            title="Ajuda"
            variant="secondary"
            onPress={() => router.push('/HelpScreen')}
          />
          <AppButton
            title="Sobre e fontes"
            variant="secondary"
            onPress={() => router.push('/AboutScreen')}
          />
          {user?.role === 'admin' && (
            <AppButton
              title="Controles de apresentação"
              variant="quiet"
              onPress={() => router.push('/PresentationScreen')}
            />
          )}
        </View>
      </ScrollView>
      <BottomSheet
        isPresented={confirm}
        onDismiss={() => {
          if (!busy) setConfirm(false);
        }}
        shouldDismissOnBackPress={!busy}
        shouldDismissOnClickOutside={!busy}
        containerColor={colors.surface}
        contentPadding={{
          left: spacing.contentPadding,
          right: spacing.contentPadding,
          bottom: spacing.xl,
        }}
      >
        <RNHostView matchContents={{ vertical: true }}>
          <View
            style={{
              width: Math.min(width, 640) - spacing.contentPadding * 2,
              gap: spacing.md,
              paddingTop: spacing.sm,
            }}
          >
            <AppText variant="sectionTitle">
              Limpar salvos da sua conta?
            </AppText>
            <AppText color="muted">
              Os chamados serão removidos da lista de acompanhamento da sua
              conta. Sua região e aparência serão mantidas.
            </AppText>
            {savedError && (
              <AppText color="risk" accessibilityRole="alert">
                {savedError}
              </AppText>
            )}
            <AppButton
              title="Apagar salvos"
              variant="destructive"
              loading={busy}
              onPress={() => {
                void clearSavedCalls().then((ok) => {
                  if (ok) setConfirm(false);
                });
              }}
            />
            <AppButton
              title="Manter salvos"
              variant="secondary"
              disabled={busy}
              onPress={() => setConfirm(false)}
            />
          </View>
        </RNHostView>
      </BottomSheet>
    </AppScreen>
  );
}
