import { useThemedStyles } from '@/theme/useTheme';
import { goBack } from '@/utils/navigation';
import { createCityStyles } from '@/features/city/CityUI';
import React from 'react';
import { View, ScrollView } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { InsetGroup, ListRow } from '@/components/ui/ListRow';
import { router } from 'expo-router';
export default function HelpScreen() {
  const cityStyles = useThemedStyles(createCityStyles);

  return (
    <AppScreen>
      <AppHeader title="Ajuda e acessibilidade" onBack={() => goBack()} />
      <ScrollView
        contentContainerStyle={cityStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 20 }}>
          <InsetGroup>
            <ListRow
              icon="book-outline"
              title="Rever a apresentação"
              subtitle="Como o Fiscaliza aí funciona, em duas telas"
              onPress={() => router.push('/OnboardingScreen')}
            />
          </InsetGroup>
          <AppText variant="sectionTitle">Escolher meu bairro</AppText>
          <AppText>
            Em Preferências, escolha um bairro de referência para abrir direto no
            mapa. Em Explorar, você pode consultar outros bairros livremente sem
            mudar essa preferência. Todo o município continua disponível, sem
            conta, CEP ou GPS obrigatório.
          </AppText>
          <AppText variant="sectionTitle">Combinar camadas</AppText>
          <AppText>
            Em Explorar, ative as categorias de seu interesse. Mapa e lista
            mostram os mesmos registros carregados; a lista também inclui
            cadastros sem ponto. Use a contagem de cada camada para carregar
            mais ou tentar novamente se houver falha. Situação, serviço e
            período filtram somente o 1746.
          </AppText>
          <AppText variant="sectionTitle">Entender datas e ausências</AppText>
          <AppText>
            O panorama consulta as datas escolhidas e informa a extensão
            disponível na base. Cobertura parcial ou desconhecida não significa
            ausência de problemas. Indisponível significa que a fonte ou o
            vínculo não está confirmado. Zero só aparece quando há publicação
            válida no recorte.
          </AppText>
          <AppText variant="sectionTitle">Preciso de atendimento</AppText>
          <AppText>
            Na aba Agir, escolha um serviço ou abra o portal oficial do 1746. A
            solicitação acontece fora do Fiscaliza aí, no atendimento da
            prefeitura. Salvar um registro aqui não gera um protocolo municipal.
          </AppText>
          <AppText variant="sectionTitle">Acompanhar e atualizar</AppText>
          <AppText>
            Salve os chamados de interesse no detalhe para retomá-los em
            Acompanhar. Eles ficam salvos neste aparelho mesmo após fechar o
            app. Arraste para baixo nas telas com atualização para consultar
            novamente a base do app. Isso não dispara uma importação nem garante
            uma atualização na origem. Em falha de conexão, o resumo salvo
            permanece disponível. Encerrado no 1746 não confirma resolução no
            local.
          </AppText>
          <AppText variant="sectionTitle">Leitura e conexão</AppText>
          <AppText>
            Use a lista para explorar sem depender do mapa. Os textos respeitam
            a escala de fonte do aparelho; os controles têm rótulos para
            TalkBack e VoiceOver. Se uma camada falhar, tente novamente nela; as
            demais permanecem disponíveis.
          </AppText>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
