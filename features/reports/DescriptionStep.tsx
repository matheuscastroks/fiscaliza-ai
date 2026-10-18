import { SlidingTabs } from '@/components/ui/SlidingTabs';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Problem } from '@/data/mockData';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppText } from '@/components/ui/AppText';
import { AppInput } from '@/components/ui/AppInput';
import { CATEGORY_LABELS } from '@/utils/occurrenceLabels';

export interface DescriptionStepProps {
  title: string;
  onTitleChange: (title: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  category: Problem['category'];
  onCategoryChange: (category: Problem['category']) => void;
  priority: Problem['priority'];
  onPriorityChange: (priority: Problem['priority']) => void;
  images: string[];
  onPickImage: () => void;
  onRemoveImage: (index: number) => void;
  error?: string | null;
}

const CATEGORY_KEYS: Problem['category'][] = [
  'road',
  'lighting',
  'cleaning',
  'others',
];
const PRIORITY_KEYS: Problem['priority'][] = ['low', 'medium', 'high'];

const PRIORITY_LABELS: Record<Problem['priority'], string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export const DescriptionStep: React.FC<DescriptionStepProps> = ({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  category,
  onCategoryChange,
  priority,
  onPriorityChange,
  images,
  onPickImage,
  onRemoveImage,
  error,
}) => {
  return (
    <View style={styles.container}>
      <AppText variant="sectionTitle" color="ink" style={styles.heading}>
        O que aconteceu?
      </AppText>
      <AppText variant="body" color="muted" style={styles.subheading}>
        Descreva o problema e adicione uma foto do local.
      </AppText>

      <AppInput
        label="O que você encontrou?"
        maxLength={5000}
        placeholder="Ex: Buraco profundo na pista próximo à travessia de pedestres..."
        value={description}
        onChangeText={onDescriptionChange}
        multiline
        numberOfLines={4}
        error={error}
        style={styles.multilineInput}
      />

      {/* Título Ajustável */}
      <AppInput
        label="Título da ocorrência"
        maxLength={120}
        placeholder="Ex: Buraco na via pública"
        value={title}
        onChangeText={onTitleChange}
      />

      {/* Seletor de Categoria */}
      <View style={styles.selectorSection}>
        <AppText variant="label" color="ink" style={styles.selectorLabel}>
          Categoria
        </AppText>
        <SlidingTabs
          edgeToEdge={false}
          label="Categoria da ocorrência"
          options={CATEGORY_KEYS.map((value) => ({
            value,
            label: CATEGORY_LABELS[value],
          }))}
          value={category}
          onChange={(value) => onCategoryChange(value as typeof category)}
        />
      </View>

      {/* Seletor de Gravidade/Prioridade */}
      <View style={styles.selectorSection}>
        <AppText variant="label" color="ink" style={styles.selectorLabel}>
          Gravidade Estimada
        </AppText>
        <SlidingTabs
          edgeToEdge={false}
          label="Gravidade estimada"
          options={PRIORITY_KEYS.map((value) => ({
            value,
            label: PRIORITY_LABELS[value],
          }))}
          value={priority}
          onChange={(value) => onPriorityChange(value as typeof priority)}
        />
      </View>

      {/* Foto / Evidência */}
      <View style={styles.photoSection}>
        <AppText variant="label" color="ink" style={styles.selectorLabel}>
          Foto da ocorrência · obrigatória
        </AppText>

        {images.length > 0 ? (
          <View style={styles.imagePreviewContainer}>
            {images.map((uri, index) => (
              <View key={uri} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => onRemoveImage(index)}
                  accessibilityRole="button"
                  accessibilityLabel="Remover foto"
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.white}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={onPickImage}
            accessibilityRole="button"
            accessibilityLabel="Adicionar foto da galeria"
          >
            <Ionicons name="camera-outline" size={22} color={colors.accent} />
            <AppText variant="label" color="accent" style={styles.addPhotoText}>
              Adicionar foto
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  heading: {
    marginBottom: spacing.xxs,
  },
  subheading: {
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  selectorSection: {
    marginBottom: spacing.lg,
  },
  selectorLabel: {
    marginBottom: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  selectorChip: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: layout.radius.button,
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
  },
  selectorChipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipText: {
    fontWeight: '500',
  },
  photoSection: {
    marginBottom: spacing.xl,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: layout.borderWidth.hairline,
    borderStyle: 'solid',
    borderColor: colors.accent,
    borderRadius: layout.radius.button,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surfaceSubdued,
  },
  addPhotoText: {
    marginLeft: spacing.xs,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: layout.radius.button,
    overflow: 'hidden',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: layout.radius.button,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.ink,
    borderRadius: layout.radius.pill,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
