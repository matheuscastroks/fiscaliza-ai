import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { CitizenAction } from '@/features/city/CitizenAction';
import {
  OfficialChannel,
  OFFICIAL_SERVICES,
} from '@/features/city/OfficialChannel';
import { useTheme, spacing, layout } from '@/theme';
export default function ParticipateScreen() {
  const { colors } = useTheme();
  return (
    <AppScreen>
      <AppHeader
        title="Agir"
        context="Encontre o atendimento para sua região"
      />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.contentPadding,
          paddingBottom: 120,
          gap: spacing.xl,
        }}
      >
        <CitizenAction
          title="Já existe um chamado?"
          description="Explore a região e salve um registro para acompanhar"
          icon="map-outline"
          onPress={() => router.push('/(tabs)/TerritoryScreen')}
        />
        <View style={{ gap: spacing.sm }}>
          <AppText variant="sectionTitle">
            Precisa solicitar um serviço?
          </AppText>
          <AppText color="muted">
            Escolha um assunto para consultar as orientações e solicitar no
            portal da prefeitura.
          </AppText>
        </View>
        {OFFICIAL_SERVICES.map((service) => (
          <View
            key={service.url}
            style={{
              backgroundColor: colors.surface,
              borderRadius: layout.radius.card,
              padding: spacing.lg,
              gap: spacing.sm,
            }}
          >
            <Ionicons name={service.icon} size={28} color={colors.onSurfaceBrand} />
            <AppText variant="sectionTitle">{service.title}</AppText>
            <AppText color="muted">{service.description}</AppText>
            <OfficialChannel url={service.url} title="Ver serviço no 1746" />
          </View>
        ))}
        <View style={{ gap: spacing.sm }}>
          <AppText variant="sectionTitle">Outro assunto?</AppText>
          <OfficialChannel title="Buscar outros serviços no 1746" />
          <AppText variant="caption" color="muted">
            Você sairá do Fiscaliza aí. A solicitação e o atendimento acontecem
            no canal oficial; seus salvos não são enviados.
          </AppText>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
