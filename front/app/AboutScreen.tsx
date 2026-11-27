import { useThemedStyles } from '@/theme/useTheme';
import { spacing } from '@/theme/spacing';
import { goBack } from '@/utils/navigation';
import { AppBrandLockup } from '@/components/ui/AppBrandGlyph';
import { AppButton } from '@/components/ui/AppButton';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { createCityStyles } from '@/features/city/CityUI';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

export default function AboutScreen() {
  const cityStyles = useThemedStyles(createCityStyles);

  return (
    <AppScreen>
      <AppHeader title="Sobre o app" onBack={() => goBack()} />
      <ScrollView
        contentContainerStyle={cityStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: spacing.lg }}>
          <AppBrandLockup size="lg" />

          <View style={{ gap: spacing.xs }}>
            <AppText variant="sectionTitle" accessibilityRole="header">Para que serve</AppText>
            <AppText>
              Chamados do 1746 e serviços públicos perto de você, com o que a
              Prefeitura divulgou. Salve os chamados que importam e encontre o
              canal oficial para pedir um serviço.
            </AppText>
          </View>

          <View style={{ gap: spacing.xs }}>
            <AppText variant="sectionTitle" accessibilityRole="header">O app não é da Prefeitura</AppText>
            <AppText>
              O Fiscaliza aí é independente da Prefeitura do Rio e não abre
              chamados. Salvar um chamado aqui não envia nada à Prefeitura.
            </AppText>
          </View>

          <View style={{ gap: spacing.xs }}>
            <AppText variant="sectionTitle" accessibilityRole="header">De onde vêm as informações</AppText>
            <AppText>
              Os chamados vêm da Central 1746, pelo portal Data.Rio da Prefeitura.
              Escolas, postos de saúde, praças e limites de bairros vêm do
              Instituto Pereira Passos (IPP) e da Prefeitura do Rio, com licença
              CC BY 4.0. O mapa é do Mapbox.
            </AppText>
          </View>

          <View style={{ gap: spacing.xs }}>
            <AppText variant="sectionTitle" accessibilityRole="header">O que os números não mostram</AppText>
            <AppText>
              Os dados chegam com atraso e podem estar desatualizados. Muitos
              chamados ou serviços numa área não dizem se o atendimento é bom ou
              ruim.
            </AppText>
          </View>

          <View style={{ gap: spacing.xs }}>
            <AppText variant="sectionTitle" accessibilityRole="header">Seus dados</AppText>
            <AppText>
              Dá para usar sem conta. Com conta, seus salvos aparecem em qualquer
              aparelho. O bairro preferido fica só neste celular.
            </AppText>
          </View>

          <View style={{ gap: spacing.xs }}>
            <AppText variant="sectionTitle" accessibilityRole="header">Ilustrações</AppText>
            <AppText>
              Pacote Notion Resources Freebie.
            </AppText>
          </View>

          <AppButton
            title="Como funciona"
            variant="secondary"
            onPress={() => router.push('/OnboardingScreen')}
          />
          <AppButton
            title="Ajuda"
            variant="secondary"
            onPress={() => router.push('/HelpScreen')}
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
}
