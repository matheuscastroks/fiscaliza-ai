import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AppToast } from '@/components/ui/AppToast';
import { ListRow } from '@/components/ui/ListRow';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { openExternal } from '@/services/openExternal';
import { OFFICIAL_PROTOCOL_LOOKUP } from '@/features/city/OfficialChannel';
import { spacing } from '@/theme';

export default function ParticipateScreen() {
  const { barTop } = useTabBarInset();
  const [linkError, setLinkError] = useState<string | null>(null);

  return (
    <AppScreen>
      <AppHeader title="Agir no 1746" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.contentPadding }}>
        <View>
          <AppText variant="sectionTitle" accessibilityRole="header">Consultar um chamado</AppText>
          <ListRow
            title="Buscar pelo protocolo"
            subtitle="Consulte os dados disponíveis no app"
            onPress={() => router.navigate({
              pathname: '/(tabs)/TerritoryScreen',
              params: { lookup: 'protocol', lookupRequest: String(Date.now()) },
            })}
          />
          <ListRow title="Ver chamados no mapa" onPress={() => router.navigate('/(tabs)/TerritoryScreen')} />
          <ListRow title="Consultar no portal do 1746" subtitle="Consulte o andamento pelo número do protocolo" onPress={() => {
            void openExternal(OFFICIAL_PROTOCOL_LOOKUP).then((ok) => {
              if (!ok) setLinkError('Não conseguimos abrir o portal. Tente de novo.');
            });
          }} />
        </View>
      </ScrollView>
      <View style={{
        paddingHorizontal: spacing.contentPadding,
        paddingTop: spacing.sm,
        paddingBottom: barTop + spacing.sm,
      }}>
        <AppButton title="Pedir um serviço no 1746" onPress={() => router.push('/OfficialServicesScreen')} />
      </View>
      <AppToast message={linkError} type="error" onDismiss={() => setLinkError(null)} />
    </AppScreen>
  );
}
