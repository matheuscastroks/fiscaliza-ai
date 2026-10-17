import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
  onRunSuggestion: () => void;
  isAnalyzing: boolean;
  analysisSuggested: boolean;
  error?: string | null;
}

const CATEGORY_KEYS: Problem['category'][] = ['road', 'lighting', 'cleaning', 'others'];
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
  onRunSuggestion,
  isAnalyzing,
  analysisSuggested,
  error,
}) => {
  return (
    <View style={styles.container}>
      <AppText variant="sectionTitle" color="ink" style={styles.heading}>
        O que aconteceu?
      </AppText>
      <AppText variant="body" color="muted" style={styles.subheading}>
        Descreva a ocorrência em detalhes com suas palavras.
      </AppText>

      <AppInput
        label="Descrição do Problema"
        placeholder="Ex: Buraco profundo na pista próximo à travessia de pedestres..."
        value={description}
        onChangeText={onDescriptionChange}
        multiline
        numberOfLines={4}
        error={error}
        style={styles.multilineInput}
      />

      {/* Assistência Heurística Local Opcional */}
      <View style={styles.suggestionBox}>
        <TouchableOpacity
          style={styles.suggestionButton}
          onPress={onRunSuggestion}
          disabled={isAnalyzing}
          accessibilityRole="button"
          accessibilityLabel="Sugerir título e categoria automaticamente"
        >
          {isAnalyzing ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <MaterialIcons name="auto-fix-high" size={18} color={colors.accent} />
          )}
          <AppText variant="label" color="accent" style={styles.suggestionButtonText}>
            {analysisSuggested ? 'Atualizar sugestão automática' : 'Sugerir título e categoria'}
          </AppText>
        </TouchableOpacity>

        <AppText variant="caption" color="muted" style={styles.suggestionNotice}>
          Classificação local baseada no texto. Não realiza envio de imagem ou chamadas de IA externa.
        </AppText>
      </View>

      {/* Título Ajustável */}
      <AppInput
        label="Título Resumido da Ocorrência"
        placeholder="Ex: Buraco na via pública"
        value={title}
        onChangeText={onTitleChange}
      />

      {/* Seletor de Categoria */}
      <View style={styles.selectorSection}>
        <AppText variant="label" color="ink" style={styles.selectorLabel}>
          Categoria do Serviço
        </AppText>
        <View style={styles.chipsRow}>
          {CATEGORY_KEYS.map((catKey) => {
            const isSelected = category === catKey;
            return (
              <TouchableOpacity
                key={catKey}
                style={[
                  styles.selectorChip,
                  isSelected && styles.selectorChipSelected,
                ]}
                onPress={() => onCategoryChange(catKey)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <AppText
                  variant="caption"
                  color={isSelected ? 'white' : 'muted'}
                  style={styles.chipText}
                >
                  {CATEGORY_LABELS[catKey]}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Seletor de Gravidade/Prioridade */}
      <View style={styles.selectorSection}>
        <AppText variant="label" color="ink" style={styles.selectorLabel}>
          Gravidade Estimada
        </AppText>
        <View style={styles.chipsRow}>
          {PRIORITY_KEYS.map((pKey) => {
            const isSelected = priority === pKey;
            return (
              <TouchableOpacity
                key={pKey}
                style={[
                  styles.selectorChip,
                  isSelected && styles.selectorChipSelected,
                ]}
                onPress={() => onPriorityChange(pKey)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <AppText
                  variant="caption"
                  color={isSelected ? 'white' : 'muted'}
                  style={styles.chipText}
                >
                  {PRIORITY_LABELS[pKey]}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Foto / Evidência */}
      <View style={styles.photoSection}>
        <AppText variant="label" color="ink" style={styles.selectorLabel}>
          Foto da Ocorrência (Opcional)
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
                  <MaterialIcons name="close" size={16} color={colors.white} />
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
            <MaterialIcons name="add-a-photo" size={22} color={colors.accent} />
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
  suggestionBox: {
    backgroundColor: colors.surfaceSubdued,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    borderRadius: layout.radius.button,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  suggestionButtonText: {
    marginLeft: spacing.xs,
  },
  suggestionNotice: {
    lineHeight: 16,
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
    borderStyle: 'dashed',
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
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
