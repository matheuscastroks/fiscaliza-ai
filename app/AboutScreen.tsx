import { useThemedStyles } from '@/theme/useTheme';
import { goBack } from '@/utils/navigation';
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
      <AppHeader title="Sobre o Fiscaliza aí" onBack={() => goBack()} />
      <ScrollView
        contentContainerStyle={cityStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 20 }}>
          <AppText variant="sectionTitle">
            Participação na gestão da cidade
          </AppText>
          <AppText>
            Um espaço para identificar necessidades do bairro, propor melhorias,
            participar de consultas e acompanhar as respostas e ações da gestão.
          </AppText>
          <AppText variant="sectionTitle">Sobre esta versão</AppText>
          <AppText>
            Projeto acadêmico com municípios reais, dados fictícios e contas de
            apresentação. Não possui vínculo com uma prefeitura real e não
            encaminha demandas a órgãos públicos.
          </AppText>
          <AppText>
            As fotografias dos registros iniciais são exemplos ilustrativos de
            iluminação, bancos, calçadas e outros contextos urbanos, obtidos no
            Wikimedia Commons (CC0) e Pexels (licença Pexels). Não representam
            os endereços desses registros. Fotos anexadas por você permanecem
            associadas à sua contribuição. Os retratos das contas de
            apresentação são ilustrativos, obtidos no Pexels sob sua licença de
            uso, e não representam usuários reais. Os cenários iniciais incluem
            números simulados de visualizações e apoios; novas interações são
            contabilizadas separadamente. A assistência de IA pode enviar a foto
            e o relato ao Gemini para sugerir o preenchimento; você revisa as
            informações antes de registrar.
          </AppText>
          <AppText variant="sectionTitle">Seus dados</AppText>
          <AppText>
            O CEP é consultado no ViaCEP para identificar seu município. Os
            limites territoriais são obtidos do IBGE. Essa associação não
            comprova residência.
          </AppText>
          <AppText>
            Registros, contribuições e fotos são armazenados no serviço desta
            aplicação. Evite incluir documentos, rostos e informações pessoais
            de terceiros. As fotos não são enviadas ao Google.
          </AppText>
          <AppText variant="sectionTitle">Assistência de classificação</AppText>
          <AppText>
            Ao pedir uma sugestão, sua descrição pode ser enviada ao Google
            Gemini pelo servidor. Se o serviço estiver indisponível, usamos
            regras locais baseadas no texto. Toda sugestão pode ser corrigida;
            ela não determina a prioridade do atendimento.
          </AppText>
          <AppText variant="sectionTitle">Acompanhamento</AppText>
          <AppText>
            As atualizações aparecem ao abrir ou atualizar a tela. Esta versão
            não envia notificações push nem mensagens por e-mail.
          </AppText>
          <AppText variant="sectionTitle">Ilustrações</AppText>
          <AppText>
            As ilustrações de apresentação e estados vazios vêm do pacote Notion
            Resources Freebie fornecido para este projeto.
          </AppText>
          <AppButton
            title="Como funciona"
            variant="secondary"
            onPress={() => router.push('/OnboardingScreen')}
          />
          <AppButton
            title="Ajuda e acessibilidade"
            variant="secondary"
            onPress={() => router.push('/HelpScreen')}
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
}
