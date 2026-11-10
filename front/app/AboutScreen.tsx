import { useThemedStyles } from '@/theme/useTheme';
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
        <View style={{ gap: 20 }}>
          <AppBrandLockup size="lg" showTagline />

          <AppText variant="sectionTitle">Para que serve</AppText>
          <AppText>
            O Fiscaliza aí mostra o que a Prefeitura divulgou sobre chamados do
            1746 e serviços públicos perto de você. Você salva os que importam e
            encontra o canal oficial para pedir um serviço.
          </AppText>

          <AppText variant="sectionTitle">O app não é da Prefeitura</AppText>
          <AppText>
            O Fiscaliza aí é independente. Não faz parte da Prefeitura do Rio e
            não abre chamados. Para pedir um serviço, use um canal oficial na
            aba Agir. Salvar um chamado aqui não envia nada à Prefeitura.
          </AppText>

          <AppText variant="sectionTitle">De onde vêm as informações</AppText>
          <AppText>
            Os chamados vêm da Central 1746, pelo portal Data.Rio da Prefeitura.
            Escolas, postos de saúde, praças e limites de bairros vêm do
            Instituto Pereira Passos (IPP) e da Prefeitura do Rio, com licença
            CC BY 4.0. O mapa é do Mapbox.
          </AppText>

          <AppText variant="sectionTitle">O que os números não mostram</AppText>
          <AppText>
            A Prefeitura atualiza os dados de tempos em tempos, não na hora. A
            data de atualização não garante que a informação esteja em dia. Ter
            muitos chamados ou serviços numa área não diz se o atendimento é bom
            ou ruim.
          </AppText>

          <AppText variant="sectionTitle">Seus dados</AppText>
          <AppText>
            Você pode usar sem conta. Seus salvos, seu bairro e o tema ficam só
            neste celular. Se limpar os dados do app, eles somem. Você pode
            apagar os salvos em Preferências.
          </AppText>

          <AppText variant="sectionTitle">Ilustrações</AppText>
          <AppText>
            As ilustrações são do pacote Notion Resources Freebie. Não usamos
            fotos genéricas para mostrar serviços reais.
          </AppText>

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
