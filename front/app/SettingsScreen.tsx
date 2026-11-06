import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import {
  AppBottomSheetModal,
  BottomSheetView,
} from '@/components/ui/AppBottomSheetModal';
import { router } from 'expo-router';
import { goBack } from '@/utils/navigation';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { SlidingTabs } from '@/components/ui/SlidingTabs';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
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
          <AppButton title="Gerenciar meus lugares" variant="secondary" onPress={() => router.push('/PlacesScreen')} />
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
          <AppText variant="sectionTitle">Chamados salvos neste aparelho</AppText>
          <AppText color="muted">
            Seus chamados acompanhados ficam neste aparelho, separados por sessão e município, sem sincronização entre dispositivos.
          </AppText>
          <AppText variant="caption" color="muted">
            {hydrated
              ? `${savedCalls.length} chamados salvos neste aparelho`
              : 'Carregando salvos…'}
          </AppText>
          <AppButton
            title="Limpar salvos neste aparelho"
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
        </View>
      </ScrollView>
      <AppBottomSheetModal
        visible={confirm}
        onClose={() => {
          if (!busy) setConfirm(false);
        }}
        enableDynamicSizing
        enablePanDownToClose={!busy}
        showHeader={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.contentPadding,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xl,
        }}
      >
        <BottomSheetView
          style={{
            gap: spacing.md,
            paddingTop: spacing.xs,
          }}
        >
          <AppText variant="sectionTitle">
            Limpar salvos neste aparelho?
          </AppText>
          <AppText color="muted">
            Os chamados serão removidos da lista de acompanhamento desta sessão no aparelho. Sua região e aparência serão mantidas.
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
        </BottomSheetView>
      </AppBottomSheetModal>
    </AppScreen>
  );
}
