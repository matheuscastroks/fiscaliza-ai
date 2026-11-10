import React, { useState } from 'react';

import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { router } from 'expo-router';

import * as Haptics from 'expo-haptics';

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
  OFFICIAL_REQUESTS_URL,
  OFFICIAL_WHATSAPP_URL,
  OFFICIAL_PHONE_URL,
  OFFICIAL_SERVICES,
} from '@/features/city/OfficialChannel';

import { useTheme, spacing, layout } from '@/theme';

import { fontSizes } from '@/theme/typography';


interface ChannelItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  url: string;
}

const OFFICIAL_CHANNELS: ChannelItem[] = [
  {
    id: 'phone',
    title: 'Ligar para o 1746',
    subtitle: 'Atendimento por telefone, 24 horas',
    icon: 'call-outline',
    url: OFFICIAL_PHONE_URL,
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Oficial da Prefeitura',
    subtitle: '(21) 3460-1746 · Mande mensagem e fotos',
    icon: 'logo-whatsapp',
    url: OFFICIAL_WHATSAPP_URL,
  },
  {
    id: 'portal',
    title: 'Portal 1746.rio',
    subtitle: 'Peça serviços pela internet',
    icon: 'globe-outline',
    url: OFFICIAL_PORTAL,
  },
  {
    id: 'requests',
    title: 'Meus Protocolos no 1746',
    subtitle: 'Veja seus pedidos e como andam',
    icon: 'receipt-outline',
    url: OFFICIAL_REQUESTS_URL,
  },
];

export default function ParticipateScreen() {
  const { colors } = useTheme();
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
      if (!ok) setLinkError('Não foi possível abrir o canal. Tente novamente.');
    });
  };

  return (
    <AppScreen>
      <AppHeader
        title="Agir no 1746"
        context="Onde pedir serviços da Prefeitura"
      />
      <KeyboardAwareScrollView
        contentContainerStyle={{
          padding: spacing.contentPadding,
          paddingBottom: 140,
          gap: spacing.lg,
        }}
        bottomOffset={48}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1) Antes de registrar algo novo: já existe chamado? */}
        <InsetGroup>
          <ListRow
            icon="map-outline"
            title="Já existe chamado? Veja no mapa"
            subtitle="Veja chamados perto de você e como andam"
            onPress={() => router.push('/(tabs)/TerritoryScreen')}
          />
        </InsetGroup>

        {/* Bloco 2: Canais Oficiais de Atendimento (Apple Inset-Grouped Table) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="shield-checkmark-outline" size={layout.iconSize.sm} color={colors.muted} />
            <AppText variant="caption" style={styles.sectionHeaderText}>
              Onde pedir um serviço
            </AppText>
          </View>

          <InsetGroup>
            {OFFICIAL_CHANNELS.map((channel) => (
              <ListRow
                key={channel.id}
                icon={channel.icon}
                title={channel.title}
                subtitle={channel.subtitle}
                onPress={() => handleOpenLink(channel.url)}
              />
            ))}
          </InsetGroup>
        </View>

        {/* 3) Montador de mensagem: uma tarefa própria, num bottom sheet (revelação progressiva) */}
        <InsetGroup>
          <ListRow
            icon="chatbubble-ellipses-outline"
            title="Escrever mensagem para o 1746"
            subtitle="Monte o texto e envie você mesmo no WhatsApp"
            onPress={() => setKitOpen(true)}
          />
        </InsetGroup>

        {/* Bloco 3: Serviços Mais Solicitados (Apple Inset-Grouped Table com Chevrons) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="apps-outline" size={layout.iconSize.sm} color={colors.muted} />
            <AppText variant="caption" style={styles.sectionHeaderText}>
              Serviços mais solicitados no Rio
            </AppText>
          </View>

          <InsetGroup>
            {OFFICIAL_SERVICES.map((service) => (
              <ListRow
                key={service.url}
                icon={service.icon}
                title={service.title}
                subtitle={`${service.agency} · ${service.description}`}
                onPress={() => handleOpenLink(service.url)}
              />
            ))}
          </InsetGroup>
        </View>
      </KeyboardAwareScrollView>
      <AppBottomSheetModal
        visible={kitOpen}
        onClose={() => setKitOpen(false)}
        title="Mensagem para o 1746"
        snapPoints={['90%']}
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

const styles = StyleSheet.create({
  sectionBlock: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: fontSizes.meta,
    fontWeight: '500',
  },
});
