import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { spacing, layout } from '@/theme';
import {
  AppBottomSheetModal,
  BottomSheetScrollView,
} from '@/components/ui/AppBottomSheetModal';
import { AppText } from '@/components/ui/AppText';
import { fontSizes } from '@/theme/typography';

export interface ComplaintTopic {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const COMPLAINT_TOPICS: ComplaintTopic[] = [
  {
    id: 'buraco',
    label: 'Buraco na rua',
    description: 'Asfalto danificado, afundamento ou cratera na via',
    icon: 'car-outline',
  },
  {
    id: 'iluminacao',
    label: 'Iluminação pública',
    description: 'Poste apagado, lâmpada piscando ou fiação solta',
    icon: 'bulb-outline',
  },
  {
    id: 'lixo',
    label: 'Lixo e entulho',
    description: 'Acúmulo irregular em calçada, terreno ou via pública',
    icon: 'trash-outline',
  },
  {
    id: 'bueiro',
    label: 'Bueiro e esgoto',
    description: 'Tampa quebrada, bueiro entupido ou transbordamento',
    icon: 'water-outline',
  },
  {
    id: 'arvore',
    label: 'Poda de árvore',
    description: 'Galhos em risco, encostando na rede elétrica ou caídos',
    icon: 'leaf-outline',
  },
  {
    id: 'semaforo',
    label: 'Semáforo apagado',
    description: 'Sinal de trânsito inoperante, quebrado ou piscando',
    icon: 'navigate-outline',
  },
  {
    id: 'calcada',
    label: 'Calçada danificada',
    description: 'Piso quebrado, buraco ou obstrução para pedestres',
    icon: 'walk-outline',
  },
  {
    id: 'vazamento',
    label: 'Vazamento de água',
    description: 'Cano da concessionária rompido ou água limpa jorrando',
    icon: 'water-outline',
  },
  {
    id: 'outro',
    label: 'Outro reparo urbano',
    description: 'Mobiliário, praça, sinalização ou outros assuntos',
    icon: 'construct-outline',
  },
];

export interface ComplaintTopicSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedTopicId: string;
  onSelectTopic: (topicId: string) => void;
}

export function ComplaintTopicSheet({
  visible,
  onClose,
  selectedTopicId,
  onSelectTopic,
}: ComplaintTopicSheetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const handleSelect = (topicId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectTopic(topicId);
    onClose();
  };

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={onClose}
      title="O que precisa de reparo?"
      snapPoints={['65%', '85%']}
      enablePanDownToClose
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="caption" color="muted" style={styles.sheetSubtitle}>
          Escolha o assunto para organizar sua mensagem para o 1746.
        </AppText>

        <View
          style={[
            styles.insetTable,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {COMPLAINT_TOPICS.map((topic, index) => {
            const isSelected = topic.id === selectedTopicId;
            return (
              <React.Fragment key={topic.id}>
                {index > 0 && (
                  <View
                    style={[styles.tableDivider, { backgroundColor: colors.divider }]}
                  />
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${topic.label} - ${topic.description}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => handleSelect(topic.id)}
                  style={({ pressed }) => [
                    styles.topicRow,
                    isSelected && { backgroundColor: colors.surfaceSubdued },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <View
                    style={[
                      styles.iconSquircle,
                      {
                        backgroundColor: isSelected
                          ? colors.primaryContainer
                          : colors.surfaceSubdued,
                      },
                    ]}
                  >
                    <Ionicons
                      name={topic.icon}
                      size={layout.iconSize.md}
                      color={isSelected ? colors.primary : colors.ink}
                    />
                  </View>

                  <View style={styles.topicTextCol}>
                    <AppText
                      variant="label"
                      style={[
                        styles.topicLabel,
                        isSelected && { color: colors.primary, fontWeight: '600' },
                      ]}
                    >
                      {topic.label}
                    </AppText>
                    <AppText variant="caption" color="muted" numberOfLines={2}>
                      {topic.description}
                    </AppText>
                  </View>

                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={layout.iconSize.md}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              </React.Fragment>
            );
          })}
        </View>
      </BottomSheetScrollView>
    </AppBottomSheetModal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: spacing.contentPadding,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    sheetSubtitle: {
      fontSize: fontSizes.meta,
      lineHeight: 18,
    },
    insetTable: {
      borderRadius: layout.radius.panel,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    tableDivider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: 56,
    },
    topicRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      gap: spacing.md,
      minHeight: 58,
    },
    iconSquircle: {
      width: 38,
      height: 38,
      borderRadius: layout.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topicTextCol: {
      flex: 1,
      gap: 2,
    },
    topicLabel: {
      fontSize: fontSizes.label,
      fontWeight: '600',
    },
  });
