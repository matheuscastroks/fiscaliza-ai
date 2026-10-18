import { goBack } from '@/utils/navigation';
import React from 'react';
import { View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { SlidingTabs } from '@/components/ui/SlidingTabs';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore, isThemePreference } from '@/stores/themeStore';
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
  const user = useAuthStore((state) => state.user);
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const persistenceError = useThemeStore((state) => state.persistenceError);
  const { isDark } = useTheme();

  return (
    <AppScreen>
      <AppHeader title="Preferências" onBack={() => goBack()} />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.contentPadding,
          paddingBottom: 120,
          gap: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
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
          <AppText color="muted">
            {preference === 'system'
              ? `Acompanha a aparência do aparelho. Agora: ${isDark ? 'escuro' : 'claro'}.`
              : 'A escolha fica salva neste aparelho.'}
          </AppText>
          {persistenceError && (
            <AppText color="risk" accessibilityRole="alert">
              {persistenceError}
            </AppText>
          )}
        </View>
        <View style={{ gap: spacing.lg }}>
          <AppText variant="sectionTitle">Leitura e acessibilidade</AppText>
          <AppText>
            O texto acompanha o tamanho definido no aparelho. Use as
            configurações do sistema para ajustar fonte, leitor de tela e
            movimento.
          </AppText>
          <AppButton
            title="Ajuda e acessibilidade"
            variant="secondary"
            onPress={() => router.push('/HelpScreen')}
          />
          <AppButton
            title="Sobre e privacidade"
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
    </AppScreen>
  );
}
