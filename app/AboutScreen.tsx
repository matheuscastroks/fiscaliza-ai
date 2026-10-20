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
          <AppText variant="sectionTitle">Conhecer e participar do Rio</AppText>
          <AppText>
            Fiscaliza Aí reúne dados públicos sobre serviços, equipamentos e
            demandas do território. É uma plataforma independente, sem vínculo
            institucional com a Prefeitura do Rio.
          </AppText>
          <AppText variant="sectionTitle">Origem das informações</AppText>
          <AppText>
            Escolas, unidades de saúde, espaços públicos e limites de bairros
            vêm do SIURB / Instituto Pereira Passos / Prefeitura da Cidade do
            Rio de Janeiro. Os cadastros são atribuídos ao IPP/PCRJ e
            disponibilizados conforme os termos da fonte (CC BY 4.0 no serviço).
            As demandas vêm da Central 1746 / DATA.RIO. O mapa utiliza
            OpenStreetMap e Leaflet.
          </AppText>
          <AppText>
            Os detalhes mostram a última importação e as datas conhecidas na
            origem. A data de importação não garante que o cadastro esteja
            atualizado. Contagens não medem capacidade, qualidade ou área de
            atendimento.
          </AppText>
          <AppText variant="sectionTitle">Participação independente</AppText>
          <AppText>
            Contribuições, propostas e discussões internas não são chamados
            oficiais do 1746 nem decisões municipais. Para solicitar atendimento
            público, utilize os canais oficiais. Atualizações no app dependem da
            publicação e importação das fontes; não são monitoramento em tempo
            real.
          </AppText>
          <AppText variant="sectionTitle">Seus dados</AppText>
          <AppText>
            A leitura territorial é pública. Ao participar com uma conta, o CEP
            ajuda a identificar seu município; não comprova residência.
            Contribuições e anexos ficam no serviço da aplicação. Evite
            documentos, rostos e dados pessoais de terceiros.
          </AppText>
          <AppText variant="sectionTitle">Ilustrações</AppText>
          <AppText>
            As ilustrações vêm do pacote Notion Resources Freebie fornecido para
            este projeto. Os detalhes cadastrais não usam fotografias genéricas
            para representar equipamentos reais.
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
