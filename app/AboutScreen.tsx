import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
export default function AboutScreen() {
  return (
    <AppScreen>
      <AppHeader title="Sobre o Fiscaliza-AI" onBack={() => router.back()} />
      <AppScreen scroll>
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
          <AppButton
            title="Ajuda e acessibilidade"
            variant="secondary"
            onPress={() => router.push('/HelpScreen')}
          />
        </View>
      </AppScreen>
    </AppScreen>
  );
}
