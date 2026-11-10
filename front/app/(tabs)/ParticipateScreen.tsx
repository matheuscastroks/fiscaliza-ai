import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
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
import { partnerBrand } from '@/theme/palette';
import { fontSizes } from '@/theme/typography';
import { IconTile } from '@/components/ui/IconTile';

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

          <View
            style={[
              styles.insetTable,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {OFFICIAL_CHANNELS.map((channel, idx) => {
              const isWhatsApp = channel.id === 'whatsapp';
              return (
                <React.Fragment key={channel.id}>
                  {idx > 0 && (
                    <View style={[styles.tableDivider, { backgroundColor: colors.divider }]} />
                  )}
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`${channel.title} - ${channel.subtitle}`}
                    onPress={() => handleOpenLink(channel.url)}
                    style={({ pressed }) => [
                      styles.tableRow,
                      pressed && { backgroundColor: colors.surfaceSubdued },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconSquircle,
                        { backgroundColor: isWhatsApp ? partnerBrand.whatsappSurface : colors.surfaceSubdued },
                      ]}
                    >
                      <Ionicons
                        name={channel.icon}
                        size={layout.iconSize.md}
                        color={isWhatsApp ? partnerBrand.whatsapp : colors.primary}
                      />
                    </View>
                    <View style={styles.tableRowContent}>
                      <AppText variant="label">{channel.title}</AppText>
                      <AppText variant="caption" color="muted">
                        {channel.subtitle}
                      </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.subtle} />
                  </Pressable>
                </React.Fragment>
              );
            })}
          </View>
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

          <View
            style={[
              styles.insetTable,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {OFFICIAL_SERVICES.map((service, idx) => (
              <React.Fragment key={service.url}>
                {idx > 0 && (
                  <View style={[styles.tableDivider, { backgroundColor: colors.divider }]} />
                )}
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`${service.title} - ${service.agency}`}
                  onPress={() => handleOpenLink(service.url)}
                  style={({ pressed }) => [
                    styles.tableRow,
                    pressed && { backgroundColor: colors.surfaceSubdued },
                  ]}
                >
                  <IconTile icon={service.icon} />
                  <View style={styles.tableRowContent}>
                    <View style={styles.serviceTitleRow}>
                      <AppText variant="label" numberOfLines={1}>
                        {service.title}
                      </AppText>
                      <View
                        style={[
                          styles.agencyBadge,
                          { backgroundColor: colors.surfaceSubdued },
                        ]}
                      >
                        <AppText variant="caption" style={styles.agencyBadgeText}>
                          {service.agency}
                        </AppText>
                      </View>
                    </View>
                    <AppText variant="caption" color="muted" numberOfLines={1}>
                      {service.description}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.subtle} />
                </Pressable>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Bloco 4: Orientação Cívica: Conferir Chamados no Mapa */}
        <View
          style={[
            styles.civicTipCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.civicTipHeader}>
            <View
              style={[
                styles.tipIconSquircle,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <Ionicons name="map-outline" size={layout.iconSize.md} color={colors.primary} />
            </View>
            <View style={styles.civicTipTextCol}>
              <AppText variant="label">Verifique o mapa antes de abrir chamado</AppText>
              <AppText variant="caption" color="muted">
                Se alguém já protocolou o mesmo problema na sua rua, você pode acompanhar o chamado existente e evitar duplicidade.
              </AppText>
            </View>
          </View>
          <AppButton
            title="Conferir chamados no mapa"
            variant="secondary"
            icon={<Ionicons name="map" size={layout.iconSize.sm} color={colors.ink} />}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/TerritoryScreen');
            }}
          />
        </View>

        {/* Bloco 5: Rodapé de Busca Geral e Transparência */}
        <View style={styles.footerBlock}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Buscar todos os serviços no portal 1746"
            onPress={() => handleOpenLink(OFFICIAL_PORTAL)}
            style={({ pressed }) => [
              styles.footerPortalButton,
              { borderColor: colors.border, backgroundColor: colors.surface },
              pressed && { backgroundColor: colors.surfaceSubdued },
            ]}
          >
            <Ionicons name="search-outline" size={layout.iconSize.sm} color={colors.ink} />
            <AppText variant="label" style={styles.footerPortalText}>
              Buscar outros serviços no 1746.rio
            </AppText>
            <Ionicons name="open-outline" size={layout.iconSize.sm} color={colors.muted} />
          </Pressable>

          <AppText variant="caption" color="muted" style={styles.disclaimerText}>
            O Fiscaliza aí é uma ferramenta cívica e independente. O registro oficial, a execução dos serviços e os prazos são de responsabilidade exclusiva dos órgãos da Prefeitura da Cidade do Rio de Janeiro.
          </AppText>
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
  insetTable: {
    borderRadius: layout.radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 56,
  },
  tableDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 54,
  },
  iconSquircle: {
    width: 34,
    height: 34,
    borderRadius: layout.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableRowContent: {
    flex: 1,
    gap: 2,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  agencyBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: layout.radius.pill,
  },
  agencyBadgeText: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
  },
  civicTipCard: {
    borderRadius: layout.radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.md,
  },
  civicTipHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipIconSquircle: {
    width: 36,
    height: 36,
    borderRadius: layout.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  civicTipTextCol: {
    flex: 1,
    gap: 3,
  },
  footerBlock: {
    gap: spacing.sm,
    paddingTop: 4,
  },
  footerPortalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: layout.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footerPortalText: {
    fontSize: fontSizes.meta,
    fontWeight: '600',
  },
  disclaimerText: {
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12,
  },
});
