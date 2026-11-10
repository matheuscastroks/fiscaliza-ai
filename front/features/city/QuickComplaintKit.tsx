import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, Pressable, Share, TextInput } from 'react-native';
import { BottomSheetTextInput } from '@/components/ui/AppBottomSheetModal';
import { openExternal } from '@/services/openExternal';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { spacing, layout } from '@/theme';
import {
  COMPLAINT_TOPICS,
  ComplaintTopicSheet,
  type ComplaintTopic,
} from './ComplaintTopicSheet';
import { partnerBrand } from '@/theme/palette';
import { fontSizes } from '@/theme/typography';
import { lightColors } from '@/theme/colors';
import { IconTile } from '@/components/ui/IconTile';

export { COMPLAINT_TOPICS, type ComplaintTopic };

export interface QuickComplaintKitProps {
  defaultLocation?: string;
  /** Dentro de um bottom sheet: usa o campo de texto do sheet (teclado não cobre o formulário). */
  inSheet?: boolean;
}

export function QuickComplaintKit({ defaultLocation = '', inSheet = false }: QuickComplaintKitProps) {
  const Input = inSheet ? BottomSheetTextInput : TextInput;
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [selectedTopic, setSelectedTopic] = useState<string>('buraco');
  const [address, setAddress] = useState(defaultLocation);
  const [description, setDescription] = useState('');
  const [detailsHeight, setDetailsHeight] = useState(60);
  const [showPreview, setShowPreview] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Sincroniza se defaultLocation chegar de forma assíncrona
  useEffect(() => {
    if (!address && defaultLocation) {
      setAddress(defaultLocation);
    }
  }, [defaultLocation, address]);

  // Reseta altura mínima se o texto for limpo
  useEffect(() => {
    if (!description) {
      setDetailsHeight(60);
    }
  }, [description]);

  const currentTopic = useMemo(
    () => COMPLAINT_TOPICS.find((t) => t.id === selectedTopic) || COMPLAINT_TOPICS[0],
    [selectedTopic],
  );

  const topicLabel = currentTopic.label;

  const formattedMessage = useMemo(() => {
    const loc = address.trim() || 'Rio de Janeiro (endereço a especificar)';
    const desc = description.trim() || 'Solicitação de reparo / vistoria';

    return (
      `Olá! Quero pedir um serviço pelo 1746:\n\n` +
      `• Assunto: ${topicLabel}\n` +
      `• Onde: ${loc}\n` +
      `• Detalhes: ${desc}`
    );
  }, [topicLabel, address, description]);

  const handleOpenWhatsApp = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const text = encodeURIComponent(formattedMessage);
    const opened = await openExternal(
      `https://wa.me/552134601746?text=${text}`,
      `https://api.whatsapp.com/send?phone=552134601746&text=${text}`,
    );
    setErrorNotice(
      opened ? null : 'Não conseguimos abrir o WhatsApp. Compartilhe o texto ou ligue para o 1746.',
    );
  };

  const handleShare = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: formattedMessage,
        title: `Solicitação 1746 - ${topicLabel}`,
      });
    } catch {
      // Ignora cancelamento do diálogo nativo
    }
  };

  const handleApplyDefaultLocation = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAddress(defaultLocation);
  };

  return (
    <View style={styles.container} accessibilityLabel="Assistente de solicitação rápida 1746">
      <View style={styles.titleBlock}>
        {!inSheet && (
          <AppText variant="sectionTitle" style={styles.title}>
            Escrever mensagem para o 1746
          </AppText>
        )}
        <AppText variant="caption" color="muted" style={styles.subtitle}>
          Você envia a mensagem pelo WhatsApp da Prefeitura. O Fiscaliza aí não envia nem acompanha o seu pedido.
        </AppText>
      </View>

      {/* Formulário Apple Inset-Grouped Table */}
      <View
        style={[
          styles.insetTable,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* Linha 1: Seletor com Bottom Sheet ("O que precisa de reparo?") */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`O que precisa de reparo: ${topicLabel}. Toque para alterar`}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSheetOpen(true);
          }}
          style={({ pressed }) => [
            styles.tableRow,
            pressed && { backgroundColor: colors.surfaceSubdued },
          ]}
        >
          <IconTile icon={currentTopic.icon} />
          <View style={styles.tableRowContent}>
            <AppText variant="caption" color="muted">
              O que precisa de reparo?
            </AppText>
            <AppText variant="label" style={styles.rowValueText}>
              {currentTopic.label}
            </AppText>
          </View>
          <View style={styles.rowActionRight}>
            <AppText variant="caption" color="muted" style={styles.changeActionText}>
              Alterar
            </AppText>
            <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.subtle} />
          </View>
        </Pressable>

        <View style={[styles.tableDivider, { backgroundColor: colors.divider }]} />

        {/* Linha 2: Endereço e Localização ("Onde é o problema?") */}
        <View style={styles.tableInputRow}>
          <IconTile icon="location-outline" />
          <View style={styles.tableInputContent}>
            <View style={styles.inputHeaderRow}>
              <AppText variant="caption" color="muted">
                Onde é o problema?
              </AppText>
              {defaultLocation && address !== defaultLocation && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Usar local sugerido: ${defaultLocation}`}
                  onPress={handleApplyDefaultLocation}
                  style={({ pressed }) => [
                    styles.suggestedLocationPill,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Ionicons name="navigate-outline" size={layout.iconSize.sm} color={colors.primary} />
                  <AppText variant="caption" style={styles.suggestedLocationText} numberOfLines={1}>
                    Usar {defaultLocation}
                  </AppText>
                </Pressable>
              )}
            </View>
            <Input
              placeholder="Rua, número aproximado ou esquina"
              placeholderTextColor={colors.muted}
              value={address}
              onChangeText={setAddress}
              returnKeyType="next"
              style={[styles.framelessInput, { color: colors.ink }]}
            />
          </View>
        </View>

        <View style={[styles.tableDivider, { backgroundColor: colors.divider }]} />

        {/* Linha 3: Detalhes Adicionais (Textarea auto-expansível) */}
        <View style={styles.tableInputRow}>
          <IconTile icon="document-text-outline" />
          <View style={styles.tableInputContent}>
            <AppText variant="caption" color="muted">
              Detalhes úteis (opcional)
            </AppText>
            <Input
              placeholder="Ex: Próximo à padaria, faixa da direita, galhos caídos"
              placeholderTextColor={colors.muted}
              value={description}
              onChangeText={setDescription}
              multiline
              onContentSizeChange={(e) => {
                const h = e.nativeEvent?.contentSize?.height;
                if (h && typeof h === 'number' && h > 0) {
                  setDetailsHeight(Math.max(60, Math.min(180, Math.ceil(h + 8))));
                }
              }}
              style={[
                styles.detailsTextarea,
                { height: detailsHeight, color: colors.ink, borderRadius: layout.radius.sm },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Dica Cívica: Fotos e Evidências no WhatsApp */}
      <View
        style={[
          styles.photoTipBanner,
          { backgroundColor: colors.surfaceSubdued, borderColor: colors.divider },
        ]}
      >
        <Ionicons name="camera-outline" size={layout.iconSize.md} color={colors.primary} />
        <View style={styles.photoTipTextCol}>
          <AppText variant="caption" style={styles.photoTipTitle}>
            Fotos no WhatsApp
          </AppText>
          <AppText variant="caption" color="muted" style={styles.photoTipBody}>
            Na conversa com o 1746 você pode mandar fotos do local.
          </AppText>
        </View>
      </View>

      {/* Progressive Disclosure: Prévia da Mensagem */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={showPreview ? 'Ocultar mensagem formatada' : 'Visualizar mensagem formatada'}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowPreview((prev) => !prev);
        }}
        style={styles.previewToggle}
      >
        <Ionicons
          name={showPreview ? 'chevron-up-circle-outline' : 'chevron-down-circle-outline'}
          size={layout.iconSize.sm}
          color={colors.primary}
        />
        <AppText variant="caption" style={styles.previewToggleText}>
          {showPreview ? 'Ocultar prévia da mensagem' : 'Ver a mensagem preparada'}
        </AppText>
      </Pressable>

      {showPreview && (
        <View style={[styles.previewBox, { backgroundColor: colors.surfaceSubdued, borderColor: colors.border }]}>
          <View style={styles.previewHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={layout.iconSize.sm} color={colors.muted} />
            <AppText variant="caption" color="muted" style={{ fontWeight: '600' }}>
              Texto para você enviar ao 1746:
            </AppText>
          </View>
          <AppText variant="caption" color="ink" style={styles.previewText} selectable>
            {formattedMessage}
          </AppText>
        </View>
      )}

      {errorNotice && (
        <AppText variant="caption" color="risk">
          {errorNotice}
        </AppText>
      )}

      {/* Ações Diretas */}
      <View style={styles.actionsBlock}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir o WhatsApp do 1746 com a mensagem"
          onPress={handleOpenWhatsApp}
          style={({ pressed }) => [
            styles.whatsAppButton,
            pressed && styles.whatsAppButtonPressed,
          ]}
        >
          <Ionicons name="logo-whatsapp" size={layout.iconSize.md} color={lightColors.white} />
          <AppText variant="label" style={styles.whatsAppButtonText}>
            Abrir WhatsApp do 1746
          </AppText>
        </Pressable>
        <AppButton
          title="Compartilhar texto"
          variant="secondary"
          icon={<Ionicons name="share-outline" size={layout.iconSize.sm} color={colors.ink} />}
          onPress={handleShare}
        />
      </View>

      {/* Bottom Sheet para Seleção de Tópico */}
      <ComplaintTopicSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        selectedTopicId={selectedTopic}
        onSelectTopic={setSelectedTopic}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: spacing.md,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: spacing.xs,
    },
    sectionHeaderText: {
      color: colors.muted,
      fontWeight: '600',
      fontSize: fontSizes.caption,
    },
    titleBlock: {
      gap: 3,
      paddingHorizontal: spacing.xs,
    },
    title: {
      fontSize: fontSizes.sectionTitle,
      lineHeight: 22,
      fontWeight: '600',
    },
    subtitle: {
      fontSize: fontSizes.meta,
      lineHeight: 18,
    },
    insetTable: {
      borderRadius: layout.radius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      gap: spacing.md,
      minHeight: 56,
    },
    tableInputRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      gap: spacing.md,
      minHeight: 56,
    },
    tableDivider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: 56,
    },
    iconSquircle: {
      width: 36,
      height: 36,
      borderRadius: layout.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    tableRowContent: {
      flex: 1,
      gap: 2,
    },
    tableInputContent: {
      flex: 1,
      gap: 4,
    },
    rowValueText: {
      fontSize: fontSizes.label,
      fontWeight: '600',
    },
    rowActionRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    changeActionText: {
      fontWeight: '600',
    },
    inputHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    suggestedLocationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primaryContainer,
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: layout.radius.pill,
    },
    suggestedLocationText: {
      color: colors.primary,
      fontSize: fontSizes.caption,
      fontWeight: '600',
      maxWidth: 160,
    },
    framelessInput: {
      fontSize: fontSizes.meta,
      lineHeight: 20,
      paddingVertical: 4,
      paddingHorizontal: 0,
      minHeight: 32,
    },
    detailsTextarea: {
      fontSize: fontSizes.meta,
      lineHeight: 20,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: colors.surfaceSubdued,
      textAlignVertical: 'top',
      marginTop: 2,
    },
    photoTipBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: layout.radius.panel,
      borderWidth: StyleSheet.hairlineWidth,
    },
    photoTipTextCol: {
      flex: 1,
      gap: 2,
    },
    photoTipTitle: {
      fontWeight: '600',
      fontSize: fontSizes.caption,
      color: colors.ink,
    },
    photoTipBody: {
      fontSize: fontSizes.caption,
      lineHeight: 17,
    },
    previewToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 4,
    },
    previewToggleText: {
      color: colors.primary,
      fontSize: fontSizes.caption,
      fontWeight: '600',
    },
    previewBox: {
      borderRadius: layout.radius.sm,
      padding: spacing.sm,
      gap: spacing.xs,
      borderWidth: StyleSheet.hairlineWidth,
    },
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    previewText: {
      fontSize: fontSizes.caption,
      lineHeight: 17,
    },
    actionsBlock: {
      gap: spacing.xs,
      marginTop: 2,
    },
    whatsAppButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: layout.touchTarget.minHeight,
      borderRadius: layout.radius.button,
      backgroundColor: partnerBrand.whatsapp,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    whatsAppButtonPressed: {
      backgroundColor: partnerBrand.whatsappPressed,
      opacity: 0.9,
    },
    whatsAppButtonText: {
      color: lightColors.white,
      fontWeight: '600',
      fontSize: fontSizes.label,
    },
  });
