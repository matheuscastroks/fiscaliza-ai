import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, Linking, Share } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { AppText } from '@/components/ui/AppText';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { spacing, layout } from '@/theme';

const COMPLAINT_TOPICS = [
  { id: 'buraco', label: 'Buraco na rua', icon: 'car-outline' },
  { id: 'iluminacao', label: 'Luz apagada / Poste', icon: 'bulb-outline' },
  { id: 'lixo', label: 'Lixo / Entulho', icon: 'trash-outline' },
  { id: 'bueiro', label: 'Bueiro / Esgoto', icon: 'water-outline' },
  { id: 'arvore', label: 'Árvore / Poda', icon: 'leaf-outline' },
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
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

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
        await Linking.openURL(`https://api.whatsapp.com/send?phone=552134601746&text=${encodeURIComponent(formattedMessage)}`);
      }
    } catch {
      setErrorNotice('Não foi possível abrir o WhatsApp automaticamente. Tente a opção de copiar ou ligar 1746.');
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
      // Ignora cancelamentos
    }
  };

  return (
    <View style={styles.card} accessibilityRole="region" accessibilityLabel="Assistente de solicitação rápida 1746">
      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          <Ionicons name="flash" size={14} color={colors.accent} />
          <AppText variant="caption" style={{ color: colors.accent, fontWeight: '700' }}>
            Assistente Rápido
          </AppText>
        </View>
        <AppText variant="sectionTitle" style={styles.title}>
          Monte sua solicitação para o 1746
        </AppText>
        <AppText variant="caption" color="muted" style={styles.subtitle}>
          O Fiscaliza aí organiza seu texto e endereço para você enviar direto no WhatsApp oficial da Prefeitura em poucos segundos.
        </AppText>
      </View>

      {/* Seleção do Tipo de Ocorrência */}
      <View style={styles.fieldBlock}>
        <AppText variant="caption" color="muted" style={styles.fieldLabel}>
          1. O que precisa de reparo?
        </AppText>
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
                style={[
                  styles.topicChip,
                  isSelected && styles.topicChipSelected,
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

      {/* Endereço e Detalhes */}
      <View style={styles.fieldBlock}>
        <AppText variant="caption" color="muted" style={styles.fieldLabel}>
          2. Onde é o problema?
        </AppText>
        <AppInput
          placeholder="Ex: Rua Barata Ribeiro, próximo ao nº 150 - Copacabana"
          value={address}
          onChangeText={setAddress}
          returnKeyType="next"
        />
      </View>

      <View style={styles.fieldBlock}>
        <AppText variant="caption" color="muted" style={styles.fieldLabel}>
          3. Detalhes úteis (opcional)
        </AppText>
        <AppInput
          placeholder="Ex: Buraco profundo na faixa da direita / Luz piscando"
          value={description}
          onChangeText={setDescription}
          returnKeyType="done"
        />
      </View>

      {/* Prévia da Mensagem Formatada */}
      <View style={styles.previewBox}>
        <View style={styles.previewHeader}>
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.muted} />
          <AppText variant="caption" color="muted" style={{ fontWeight: '600' }}>
            Mensagem pré-formatada para a Central 1746:
          </AppText>
        </View>
        <AppText variant="caption" color="ink" style={styles.previewText} selectable>
          {formattedMessage}
        </AppText>
      </View>

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
          onPress={handleOpenWhatsApp}
        />
        <AppButton
          title="Compartilhar texto da solicitação"
          variant="secondary"
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
      borderRadius: layout.radius.card,
      padding: spacing.md,
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      gap: spacing.xxs,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    title: {
      fontSize: 18,
      lineHeight: 22,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 18,
    },
    fieldBlock: {
      gap: spacing.xs,
    },
    fieldLabel: {
      fontWeight: '600',
    },
    topicsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    topicChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: layout.radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubdued,
    },
    topicChipSelected: {
      backgroundColor: colors.onSurfaceBrand,
      borderColor: colors.onSurfaceBrand,
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
    previewBox: {
      backgroundColor: colors.surfaceSubdued,
      borderRadius: layout.radius.panel,
      padding: spacing.sm,
      gap: spacing.xs,
      borderWidth: 1,
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
      marginTop: spacing.xs,
    },
  });
