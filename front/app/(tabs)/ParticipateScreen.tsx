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
    subtitle: 'Atendimento telefônico 24h para chamados e emergências',
    icon: 'call-outline',
    url: OFFICIAL_PHONE_URL,
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Oficial da Prefeitura',
    subtitle: '(21) 3460-1746 · Canal oficial com envio de fotos no chat',
    icon: 'logo-whatsapp',
    url: OFFICIAL_WHATSAPP_URL,
  },
  {
    id: 'portal',
    title: 'Portal 1746.rio',
    subtitle: 'Catálogo de serviços online e formulários detalhados',
    icon: 'globe-outline',
    url: OFFICIAL_PORTAL,
  },
  {
    id: 'requests',
    title: 'Meus Protocolos no 1746',
    subtitle: 'Histórico de solicitações e acompanhamento oficial',
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
        context="Canais oficiais da Prefeitura"
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
            subtitle="Procure registros próximos e acompanhe o andamento publicado"
            onPress={() => router.push('/(tabs)/TerritoryScreen')}
          />
        </InsetGroup>

        {/* Bloco 2: Canais Oficiais de Atendimento (Apple Inset-Grouped Table) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="shield-checkmark-outline" size={layout.iconSize.sm} color={colors.muted} />
            <AppText variant="caption" style={styles.sectionHeaderText}>
              Canais oficiais de atendimento
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

        {/* 3) Montador de mensagem, recolhido (revelação progressiva) */}
        <InsetGroup>
          <ListRow
            icon="chatbubble-ellipses-outline"
            title="Preparar mensagem para o WhatsApp do 1746"
            subtitle={kitOpen ? 'Toque para recolher' : 'Monte o texto e envie você mesmo pelo canal oficial'}
            onPress={() => setKitOpen((open) => !open)}
          />
        </InsetGroup>
        {kitOpen && (
          <QuickComplaintKit
            defaultLocation={neighborhood ? `${neighborhood}, Rio de Janeiro` : 'Rio de Janeiro'}
          />
        )}

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
