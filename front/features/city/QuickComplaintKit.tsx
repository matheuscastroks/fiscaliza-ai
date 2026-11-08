import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, Pressable, Linking, Share } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { AppText } from '@/components/ui/AppText';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { spacing, layout } from '@/theme';

export const COMPLAINT_TOPICS = [
  { id: 'buraco', label: 'Buraco na rua', icon: 'car-outline' },
  { id: 'iluminacao', label: 'Luz apagada / Poste', icon: 'bulb-outline' },
  { id: 'lixo', label: 'Lixo / Entulho', icon: 'trash-outline' },
  { id: 'bueiro', label: 'Bueiro / Esgoto', icon: 'water-outline' },
  { id: 'arvore', label: 'Poda de árvore', icon: 'leaf-outline' },
  { id: 'semaforo', label: 'Semáforo apagado', icon: 'navigate-outline' },
];

export interface QuickComplaintKitProps {
  defaultLocation?: string;
}

export function QuickComplaintKit({ defaultLocation = '' }: QuickComplaintKitProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [selectedTopic, setSelectedTopic] = useState<string>('buraco');
  const [address, setAddress] = useState(defaultLocation);
  const [description, setDescription] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Sincroniza se defaultLocation chegar de forma assíncrona
  useEffect(() => {
    if (!address && defaultLocation) {
      setAddress(defaultLocation);
    }
  }, [defaultLocation, address]);

  const topicLabel = useMemo(
    () => COMPLAINT_TOPICS.find((t) => t.id === selectedTopic)?.label || 'Demanda urbana',
    [selectedTopic],
  );

  const formattedMessage = useMemo(() => {
    const loc = address.trim() || 'Rio de Janeiro (endereço a especificar)';
    const desc = description.trim() || 'Solicitação de reparo / vistoria';

    return (
      `Olá! Gostaria de abrir uma solicitação no 1746:\n\n` +
      `• Serviço: ${topicLabel}\n` +
      `• Local / Referência: ${loc}\n` +
      `• Descrição: ${desc}\n\n` +
      `Registrado com auxílio do aplicativo Fiscaliza aí.`
    );
  }, [topicLabel, address, description]);

  const handleOpenWhatsApp = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = `https://wa.me/552134601746?text=${encodeURIComponent(formattedMessage)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(
          `https://api.whatsapp.com/send?phone=552134601746&text=${encodeURIComponent(formattedMessage)}`,
        );
      }
    } catch {
      setErrorNotice('Não foi possível abrir o WhatsApp automaticamente. Tente a opção de compartilhar ou ligar 1746.');
    }
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
    <View style={styles.card} accessibilityLabel="Assistente de solicitação rápida 1746">
      {/* Cabeçalho do Assistente */}
      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          <Ionicons name="flash" size={13} color={colors.accent} />
          <AppText variant="caption" style={styles.badgeText}>
            ASSISTENTE RÁPIDO 1746
          </AppText>
        </View>
        <AppText variant="sectionTitle" style={styles.title}>
          Monte sua solicitação oficial
        </AppText>
        <AppText variant="caption" color="muted" style={styles.subtitle}>
          Organize o chamado e envie em segundos diretamente para o WhatsApp oficial da Central 1746 da Prefeitura.
        </AppText>
      </View>

      {/* 1. Escolha do Problema Urbano */}
      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelRow}>
          <Ionicons name="construct-outline" size={13} color={colors.muted} />
          <AppText variant="caption" color="muted" style={styles.fieldLabel}>
            1. O que precisa de reparo?
          </AppText>
        </View>
        <View style={styles.topicsGrid}>
          {COMPLAINT_TOPICS.map((topic) => {
            const isSelected = selectedTopic === topic.id;
            return (
              <Pressable
                key={topic.id}
                accessibilityRole="button"
                accessibilityLabel={topic.label}
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedTopic(topic.id);
                }}
                style={({ pressed }) => [
                  styles.topicChip,
                  isSelected && styles.topicChipSelected,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons
                  name={topic.icon as React.ComponentProps<typeof Ionicons>['name']}
                  size={14}
                  color={isSelected ? colors.onAccentBrand : colors.ink}
                />
                <AppText
                  variant="caption"
                  numberOfLines={1}
                  style={[
                    styles.topicChipText,
                    isSelected && styles.topicChipTextSelected,
                  ]}
                >
                  {topic.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 2. Endereço e Referência */}
      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelRow}>
          <Ionicons name="location-outline" size={13} color={colors.muted} />
          <AppText variant="caption" color="muted" style={styles.fieldLabel}>
            2. Onde é o problema?
          </AppText>
        </View>

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
            <Ionicons name="navigate-outline" size={12} color={colors.primary} />
            <AppText variant="caption" style={styles.suggestedLocationText} numberOfLines={1}>
              Usar bairro ativo: {defaultLocation}
            </AppText>
          </Pressable>
        )}

        <AppInput
          placeholder="Ex: Rua Barata Ribeiro, próximo ao nº 150 - Copacabana"
          value={address}
          onChangeText={setAddress}
          returnKeyType="next"
        />
      </View>

      {/* 3. Detalhes Adicionais (Opcional) */}
      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelRow}>
          <Ionicons name="document-text-outline" size={13} color={colors.muted} />
          <AppText variant="caption" color="muted" style={styles.fieldLabel}>
            3. Detalhes úteis (opcional)
          </AppText>
        </View>
        <AppInput
          placeholder="Ex: Buraco profundo na faixa da direita / Luz piscando à noite"
          value={description}
          onChangeText={setDescription}
          returnKeyType="done"
        />
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
          size={16}
          color={colors.primary}
        />
        <AppText variant="caption" style={styles.previewToggleText}>
          {showPreview ? 'Ocultar prévia da mensagem' : 'Ver mensagem que será enviada'}
        </AppText>
      </Pressable>

      {showPreview && (
        <View style={styles.previewBox}>
          <View style={styles.previewHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={13} color={colors.muted} />
            <AppText variant="caption" color="muted" style={{ fontWeight: '600' }}>
              Texto preparado para a Central 1746:
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
        <AppButton
          title="Enviar no WhatsApp do 1746"
          variant="primary"
          icon={<Ionicons name="logo-whatsapp" size={18} color={colors.onAccent} />}
          onPress={handleOpenWhatsApp}
        />
        <AppButton
          title="Compartilhar texto da solicitação"
          variant="secondary"
          icon={<Ionicons name="share-outline" size={16} color={colors.ink} />}
          onPress={handleShare}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: layout.radius.panel,
      padding: spacing.md,
      gap: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHeader: {
      gap: 3,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    badgeText: {
      color: colors.accent,
      fontWeight: '800',
      fontSize: 11,
      letterSpacing: 0.5,
    },
    title: {
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '700',
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 18,
    },
    fieldBlock: {
      gap: 6,
    },
    fieldLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    fieldLabel: {
      fontWeight: '700',
      fontSize: 12,
    },
    topicsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    topicChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 11,
      borderRadius: layout.radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubdued,
    },
    topicChipSelected: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    topicChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.ink,
    },
    topicChipTextSelected: {
      color: colors.surface,
      fontWeight: '700',
    },
    suggestedLocationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryContainer,
      paddingVertical: 4,
      paddingHorizontal: 9,
      borderRadius: layout.radius.pill,
      marginBottom: 2,
    },
    suggestedLocationText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '700',
    },
    previewToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 6,
    },
    previewToggleText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    previewBox: {
      backgroundColor: colors.surfaceSubdued,
      borderRadius: layout.radius.sm,
      padding: spacing.sm,
      gap: spacing.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    previewText: {
      fontSize: 12,
      lineHeight: 17,
      fontFamily: 'monospace',
    },
    actionsBlock: {
      gap: spacing.xs,
      marginTop: 2,
    },
  });
