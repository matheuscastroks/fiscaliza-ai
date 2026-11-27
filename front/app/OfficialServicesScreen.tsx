import { useState } from 'react';



import { router, useLocalSearchParams } from 'expo-router';

import * as Haptics from 'expo-haptics';
import { View } from 'react-native';

import { AppScreen } from '@/components/ui/AppScreen';

import { AppHeader } from '@/components/ui/AppHeader';

import { AppText } from '@/components/ui/AppText';

import { AppToast } from '@/components/ui/AppToast';

import { InsetGroup, ListRow } from '@/components/ui/ListRow';

import { openExternal } from '@/services/openExternal';

import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';


import {
  OFFICIAL_PORTAL,
  OFFICIAL_WHATSAPP_LABEL,
  OFFICIAL_WHATSAPP_URL,
  OFFICIAL_PHONE_URL,
  OFFICIAL_SERVICES,
} from '@/features/city/OfficialChannel';

import { spacing } from '@/theme';





interface ChannelItem {
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

const OFFICIAL_CHANNELS: ChannelItem[] = [
  {
    id: 'phone',
    title: 'Ligar para o 1746',
    subtitle: '24 horas',
    url: OFFICIAL_PHONE_URL,
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Oficial da Prefeitura',
    subtitle: OFFICIAL_WHATSAPP_LABEL,
    url: OFFICIAL_WHATSAPP_URL,
  },
  {
    id: 'portal',
    title: 'Portal 1746.rio',
    subtitle: 'Pedidos pela internet',
    url: OFFICIAL_PORTAL,
  },
];

export default function OfficialServicesScreen() {
  const { view } = useLocalSearchParams<{ view?: string }>();
  const byTopic = view === 'topics';
  const [linkError, setLinkError] = useState<string | null>(null);
  const handleOpenLink = (url: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void openExternal(url).then((ok) => {
      if (!ok) setLinkError('Não conseguimos abrir o canal. Tente de novo.');
    });
  };

  return (
    <AppScreen>
      <AppHeader title={byTopic ? 'Serviços por assunto' : 'Canais do 1746'} hideUserAvatar onBack={() => router.back()} />
      <KeyboardAwareScrollView contentContainerStyle={{ padding: spacing.contentPadding, paddingBottom: spacing.xxxl, gap: spacing.lg }}>
        {byTopic ? (
          <>
            <InsetGroup>
              {OFFICIAL_SERVICES.map((service) => (
                <ListRow
                  key={service.url}
                  title={service.title}
                  subtitle={service.description}
                  accessibilityRole="link"
                  onPress={() => handleOpenLink(service.url)}
                />
              ))}
            </InsetGroup>
          </>
        ) : (
          <>
            <InsetGroup>
              {[OFFICIAL_CHANNELS[1], OFFICIAL_CHANNELS[0], OFFICIAL_CHANNELS[2]].map((channel) => (
                <ListRow key={channel.id} title={channel.title} subtitle={channel.subtitle} onPress={() => handleOpenLink(channel.url)} />
              ))}
            </InsetGroup>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="sectionTitle" accessibilityRole="header">Pela internet</AppText>
              <InsetGroup>
                <ListRow title="Serviços por assunto" subtitle="Páginas oficiais de cada serviço no 1746" onPress={() => router.push({ pathname: '/OfficialServicesScreen', params: { view: 'topics' } })} />
              </InsetGroup>
            </View>
          </>
        )}
      </KeyboardAwareScrollView>
      <AppToast message={linkError} type="error" onDismiss={() => setLinkError(null)} />
    </AppScreen>
  );
}
