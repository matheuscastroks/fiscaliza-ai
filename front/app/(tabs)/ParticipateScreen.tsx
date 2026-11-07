import { ScrollView, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { CitizenAction } from '@/features/city/CitizenAction';
import {
  OfficialChannel,
  OFFICIAL_PORTAL,
  OFFICIAL_SIGNIN_URL,
  OFFICIAL_REQUESTS_URL,
  OFFICIAL_WHATSAPP_URL,
  OFFICIAL_PHONE_URL,
  OFFICIAL_SERVICES,
} from '@/features/city/OfficialChannel';
import { useTheme, spacing, layout } from '@/theme';

const PREPARATION_STEPS: {
  step: string;
  title: string;
  description: string;
}[] = [
  {
    step: '1',
    title: 'Confira se já há protocolo aberto',
    description:
      'Consulte o mapa do Fiscaliza aí na sua rua. Se já existir chamado, você pode salvá-lo para acompanhar.',
  },
  {
    step: '2',
    title: 'Anote o endereço exato e tire foto',
    description:
      'O 1746 pede logradouro, número ou ponto de referência próximo e permite anexar foto da ocorrência.',
  },
  {
    step: '3',
    title: 'Registre na Central 1746 e guarde o protocolo',
    description:
      'Com o cadastro no 1746.rio ou pelo WhatsApp oficial, você recebe o número do protocolo para cobrar o prazo.',
  },
];

export default function ParticipateScreen() {
  const { colors } = useTheme();
  return (
    <AppScreen>
      <AppHeader
        title="Agir no 1746"
        context="Canais oficiais da Prefeitura do Rio para abrir e consultar protocolos"
      />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.contentPadding,
          paddingBottom: 120,
          gap: spacing.xl,
        }}
      >
        {/* Bloco 1: Cadastro, Login e Acompanhamento Direto no 1746.rio */}
        <View style={[styles.accountCard, { backgroundColor: colors.surface }]}>
          <AppText variant="caption" color="muted">
            Central 1746 · Prefeitura do Rio
          </AppText>
          <AppText variant="sectionTitle">
            Sua conta no Portal 1746.rio
          </AppText>
          <AppText variant="body" color="muted">
            Ter cadastro no portal oficial da Prefeitura permite abrir
            solicitações identificadas com foto, receber atualizações e
            consultar o histórico dos seus protocolos.
          </AppText>

          <View style={styles.accountActions}>
            <OfficialChannel
              url={OFFICIAL_SIGNIN_URL}
              title="Criar conta ou entrar no 1746"
              variant="primary"
            />
            <OfficialChannel
              url={OFFICIAL_REQUESTS_URL}
              title="Consultar meus protocolos no 1746"
              variant="secondary"
            />
          </View>
        </View>

        {/* Bloco 2: Canais Rápidos de Atendimento */}
        <View style={styles.sectionBlock}>
          <AppText variant="sectionTitle">Canais diretos de abertura</AppText>

          <View style={[styles.channelCard, { backgroundColor: colors.surface }]}>
            <View style={styles.channelRow}>
              <Ionicons name="logo-whatsapp" size={22} color={colors.ink} />
              <View style={styles.channelTextCol}>
                <AppText variant="label">
                  WhatsApp Oficial · (21) 3460-1746
                </AppText>
                <AppText variant="caption" color="muted">
                  Envie mensagem, localização e foto pelo assistente oficial.
                </AppText>
              </View>
            </View>
            <OfficialChannel
              url={OFFICIAL_WHATSAPP_URL}
              title="Abrir no WhatsApp"
            />
          </View>

          <View style={styles.dualChannelRow}>
            <View
              style={[
                styles.compactChannelCard,
                { backgroundColor: colors.surface },
              ]}
            >
              <Ionicons name="call-outline" size={20} color={colors.ink} />
              <AppText variant="label">Telefone 1746</AppText>
              <AppText variant="caption" color="muted">
                Atendimento 24h por ligação no Rio.
              </AppText>
              <OfficialChannel url={OFFICIAL_PHONE_URL} title="Ligar 1746" />
            </View>

            <View
              style={[
                styles.compactChannelCard,
                { backgroundColor: colors.surface },
              ]}
            >
              <Ionicons name="globe-outline" size={20} color={colors.ink} />
              <AppText variant="label">Portal 1746.rio</AppText>
              <AppText variant="caption" color="muted">
                Guia completo dos serviços municipais.
              </AppText>
              <OfficialChannel url={OFFICIAL_PORTAL} title="Abrir portal" />
            </View>
          </View>
        </View>

        {/* Bloco 3: Passo a Passo de Preparo */}
        <View style={styles.sectionBlock}>
          <AppText variant="sectionTitle">
            Como preparar sua solicitação
          </AppText>

          <View style={[styles.stepsCard, { backgroundColor: colors.surface }]}>
            {PREPARATION_STEPS.map((item, idx) => (
              <View
                key={item.step}
                style={[
                  styles.stepRow,
                  idx > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.divider,
                    paddingTop: spacing.sm,
                  },
                ]}
              >
                <AppText variant="protocol" color="muted" style={styles.stepNum}>
                  {item.step}.
                </AppText>
                <View style={styles.stepContent}>
                  <AppText variant="label">{item.title}</AppText>
                  <AppText variant="caption" color="muted">
                    {item.description}
                  </AppText>
                </View>
              </View>
            ))}
          </View>

          <CitizenAction
            title="Conferir chamados na minha rua antes"
            description="Veja no mapa se alguém já abriu protocolo para o problema"
            icon="map-outline"
            onPress={() => router.push('/(tabs)/TerritoryScreen')}
          />
        </View>

        {/* Bloco 4: Catálogo de Serviços Mais Solicitados no 1746 */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <AppText variant="sectionTitle">
              Serviços mais solicitados no 1746
            </AppText>
            <AppText variant="caption" color="muted">
              Acesse a página oficial do serviço com prazos, órgão responsável e
              formulário:
            </AppText>
          </View>

          {OFFICIAL_SERVICES.map((service) => (
            <View
              key={service.url}
              style={[styles.serviceCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.serviceHeader}>
                <Ionicons name={service.icon} size={20} color={colors.ink} />
                <View style={styles.serviceTitleCol}>
                  <AppText variant="caption" color="muted">
                    {service.agency}
                  </AppText>
                  <AppText variant="label">{service.title}</AppText>
                </View>
              </View>
              <AppText variant="caption" color="muted">
                {service.description}
              </AppText>
              <OfficialChannel
                url={service.url}
                title="Solicitar no 1746"
              />
            </View>
          ))}
        </View>

        {/* Rodapé de Busca Geral e Transparência */}
        <View style={styles.footerBlock}>
          <AppText variant="sectionTitle">Não encontrou o assunto?</AppText>
          <OfficialChannel
            url={OFFICIAL_PORTAL}
            title="Buscar todos os serviços no 1746.rio"
          />
          <AppText variant="caption" color="muted">
            O Fiscaliza aí é independente da prefeitura. O protocolo e o
            atendimento acontecem exclusivamente nos canais oficiais da Central
            1746; seus acompanhamentos ficam salvos neste aparelho.
          </AppText>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    borderRadius: layout.radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  accountActions: {
    gap: spacing.xs,
    paddingTop: spacing.xxs,
  },
  sectionBlock: {
    gap: spacing.sm,
  },
  sectionHeader: {
    gap: spacing.xxs,
  },
  channelCard: {
    borderRadius: layout.radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  channelTextCol: {
    flex: 1,
    gap: 2,
  },
  dualChannelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  compactChannelCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: layout.radius.card,
    padding: spacing.lg,
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  stepsCard: {
    borderRadius: layout.radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  stepNum: {
    width: 18,
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  serviceCard: {
    borderRadius: layout.radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  serviceTitleCol: {
    flex: 1,
    gap: 2,
  },
  footerBlock: {
    gap: spacing.sm,
  },
});
