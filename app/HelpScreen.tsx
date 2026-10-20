import { useThemedStyles } from '@/theme/useTheme';
import { goBack } from '@/utils/navigation';
import { createCityStyles } from '@/features/city/CityUI';
import React from 'react';
import { View, ScrollView } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
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
          <AppText variant="sectionTitle">Escolher meu bairro</AppText>
          <AppText>
            Na Home ou no Território, escolha um bairro. O panorama reúne
            cadastros de escolas, saúde, espaços públicos e demandas do 1746.
            Você não precisa entrar na conta para consultar dados públicos.
          </AppText>
          <AppText variant="sectionTitle">Combinar camadas</AppText>
          <AppText>
            No Território, ative as categorias de seu interesse. Mapa e lista
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
            O Fiscaliza Aí não abre chamados no 1746. Use os canais oficiais da
            Prefeitura do Rio para solicitar serviços. As contribuições da
            comunidade no app não substituem o protocolo municipal.
          </AppText>
          <AppText variant="sectionTitle">Acompanhar e atualizar</AppText>
          <AppText>
            Salve os chamados de interesse no detalhe para retomá-los em
            Acompanhar. Arraste para baixo nas telas com atualização para
            consultar novamente a base do app. Isso não dispara uma importação
            nem garante uma atualização na origem.
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
