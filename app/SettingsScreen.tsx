import { goBack } from '@/utils/navigation';
import { cityStyles } from '@/features/city/CityUI';
import React from 'react';
import { View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useAuthStore } from '@/stores/authStore';
export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  return (
    <AppScreen>
      <AppHeader title="Preferências" onBack={() => goBack()} />
      <ScrollView
        contentContainerStyle={cityStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 20 }}>
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
