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

import { QuickComplaintKit } from '@/features/city/QuickComplaintKit';
import { AppBottomSheetModal, BottomSheetScrollView } from '@/components/ui/AppBottomSheetModal';

import { usePlacesStore } from '@/stores/placesStore';

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
    subtitle: 'Atendimento por telefone, 24 horas',
    url: OFFICIAL_PHONE_URL,
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Oficial da Prefeitura',
    subtitle: `${OFFICIAL_WHATSAPP_LABEL} · Mande mensagem e fotos`,
    url: OFFICIAL_WHATSAPP_URL,
  },
  {
    id: 'portal',
    title: 'Portal 1746.rio',
    subtitle: 'Peça serviços pela internet',
    url: OFFICIAL_PORTAL,
  },
];

export default function OfficialServicesScreen() {
  const { view } = useLocalSearchParams<{ view?: string }>();
  const byTopic = view === 'topics';
  const neighborhood = usePlacesStore((s) => {
    const { selection } = s;
    if (selection.kind === 'neighborhood') return selection.name;
    if (selection.kind === 'radius') return selection.neighborhood?.name ?? '';
    return '';
  });

  const [linkError, setLinkError] = useState<string | null>(null);
  const [kitOpen, setKitOpen] = useState(false);
  const handleOpenLink = (url: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void openExternal(url).then((ok) => {
      if (!ok) setLinkError('Não conseguimos abrir o canal. Tente de novo.');
    });
  };

  return (
    <AppScreen>
      <AppHeader title={byTopic ? 'Serviços por assunto' : 'Pedir um serviço'} hideUserAvatar onBack={() => router.back()} />
      <KeyboardAwareScrollView contentContainerStyle={{ padding: spacing.contentPadding, paddingBottom: spacing.xxxl, gap: spacing.lg }}>
        {byTopic ? (
          <>
            <AppText variant="body" color="muted">Os links abrem a página do serviço no portal 1746.</AppText>
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
            <AppText variant="body" color="muted">Você envia o pedido pelo canal oficial da Prefeitura.</AppText>
            <InsetGroup>
              {[OFFICIAL_CHANNELS[1], OFFICIAL_CHANNELS[0], OFFICIAL_CHANNELS[2]].map((channel) => (
                <ListRow key={channel.id} title={channel.title} subtitle={channel.subtitle} onPress={() => handleOpenLink(channel.url)} />
              ))}
            </InsetGroup>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="sectionTitle" accessibilityRole="header">Ajuda para fazer o pedido</AppText>
              <InsetGroup>
                <ListRow title="Preparar pedido com foto" subtitle="Foto e texto para o WhatsApp do 1746" onPress={() => setKitOpen(true)} />
                <ListRow title="Encontrar serviços por assunto" onPress={() => router.push({ pathname: '/OfficialServicesScreen', params: { view: 'topics' } })} />
              </InsetGroup>
            </View>
          </>
        )}
      </KeyboardAwareScrollView>
      <AppBottomSheetModal
        visible={kitOpen}
        onClose={() => setKitOpen(false)}
        title="Mensagem para o 1746"
        enableDynamicSizing
        enableBlurKeyboardOnGesture
      >
        <BottomSheetScrollView
          contentContainerStyle={{ padding: spacing.contentPadding, paddingBottom: spacing.xxxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <QuickComplaintKit
            inSheet
            defaultLocation={neighborhood ? `${neighborhood}, Rio de Janeiro` : 'Rio de Janeiro'}
          />
        </BottomSheetScrollView>
      </AppBottomSheetModal>
      <AppToast message={linkError} type="error" onDismiss={() => setLinkError(null)} />
    </AppScreen>
  );
}
