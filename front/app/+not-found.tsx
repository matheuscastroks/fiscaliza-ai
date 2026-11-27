import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/theme/spacing';

export default function NotFound() {
  const insets = useSafeAreaInsets();

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={{ padding: spacing.contentPadding, gap: spacing.sm }}>
        <AppText variant="screenTitle" accessibilityRole="header">
          Página indisponível
        </AppText>
        <AppText color="muted">
          Você pode continuar explorando os chamados e serviços no mapa.
        </AppText>
      </ScrollView>
      <View style={{ paddingHorizontal: spacing.contentPadding, paddingBottom: Math.max(insets.bottom, spacing.md) }}>
        <AppButton title="Abrir o mapa" onPress={() => router.replace('/(tabs)')} />
      </View>
    </AppScreen>
  );
}
