import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
export default function HelpScreen() {
  return (
    <AppScreen>
      <AppHeader title="Ajuda e acessibilidade" onBack={() => router.back()} />
      <AppScreen scroll>
        <View style={{ gap: 20 }}>
          <AppText variant="sectionTitle">Meu município</AppText>
          <AppText>
            O CEP do seu perfil define o município onde você participa. Ao mudar
            de residência, use Meu perfil → Atualizar CEP e município. Seu
            histórico anterior é preservado; novos registros precisam estar
            dentro da cidade confirmada.
          </AppText>
          <AppText variant="sectionTitle">Encontrei um problema</AppText>
          <AppText>
            Em Participar, escolha Registrar ocorrência. Informe o endereço e
            marque o ponto. Antes de enviar, veja se existe um registro
            parecido; você pode apoiá-lo ou acrescentar uma informação.
          </AppText>
          <AppText variant="sectionTitle">Quero sugerir uma melhoria</AppText>
          <AppText>
            Escolha Propor uma melhoria. Conte o que deveria mudar e por que
            isso é importante para o bairro. A resposta da gestão fica na
            própria proposta.
          </AppText>
          <AppText variant="sectionTitle">Como acompanho o resultado?</AppText>
          <AppText>
            Use Acompanhar para retomar registros e participações. No detalhe,
            acompanhe as respostas, o setor responsável e as evidências. Você
            pode confirmar uma solução ou explicar por que precisa ser revista.
          </AppText>
          <AppText variant="sectionTitle">Leitura e navegação</AppText>
          <AppText>
            A lista oferece acesso às ocorrências sem depender do mapa. O texto
            segue a escala de fonte do aparelho. Use TalkBack no Android ou
            VoiceOver no iOS para navegar por rótulos e controles.
          </AppText>
          <AppText variant="sectionTitle">Se a conexão cair</AppText>
          <AppText>
            Seu registro permanece como rascunho. Volte quando a conexão estiver
            disponível e tente enviar novamente.
          </AppText>
        </View>
      </AppScreen>
    </AppScreen>
  );
}
