import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Problem } from '@/data/mockData';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppText } from '@/components/ui/AppText';
import { AppDivider } from '@/components/ui/AppDivider';
import { CATEGORY_LABELS } from '@/utils/occurrenceLabels';

export interface ReviewStepProps {
  title: string;
  category: Problem['category'];
  priority: Problem['priority'];
  address: string;
  description: string;
  images: string[];
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  title,
  category,
  priority,
  address,
  description,
  images,
}) => {
  return (
    <View style={styles.container}>
      <AppText variant="sectionTitle" color="ink" style={styles.heading}>
        Revisar informações
      </AppText>
      <AppText variant="body" color="muted" style={styles.subheading}>
        Verifique os dados da ocorrência antes de registrar.
      </AppText>

      <View style={styles.reviewCard}>
        <View style={styles.fieldGroup}>
          <AppText variant="caption" color="muted">
            TÍTULO
          </AppText>
          <AppText variant="label" color="ink" style={styles.fieldValue}>
            {title || 'Ocorrência sem título'}
          </AppText>
        </View>

        <AppDivider spacingVertical="xs" />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <AppText variant="caption" color="muted">
              CATEGORIA
            </AppText>
            <AppText variant="body" color="ink" style={styles.fieldValue}>
              {CATEGORY_LABELS[category]}
            </AppText>
          </View>

          <View style={styles.halfField}>
            <AppText variant="caption" color="muted">
              GRAVIDADE
            </AppText>
            <AppText variant="body" color="ink" style={styles.fieldValue}>
              {priority === 'high'
                ? 'Alta'
                : priority === 'medium'
                  ? 'Média'
                  : 'Baixa'}
            </AppText>
          </View>
        </View>

        <AppDivider spacingVertical="xs" />

        <View style={styles.fieldGroup}>
          <AppText variant="caption" color="muted">
            LOCALIZAÇÃO
          </AppText>
          <AppText variant="body" color="ink" style={styles.fieldValue}>
            {address}
          </AppText>
        </View>

        <AppDivider spacingVertical="xs" />

        <View style={styles.fieldGroup}>
          <AppText variant="caption" color="muted">
            DESCRIÇÃO
          </AppText>
          <AppText variant="body" color="ink" style={styles.fieldValue}>
            {description}
          </AppText>
        </View>

        {images.length > 0 ? (
          <>
            <AppDivider spacingVertical="xs" />
            <View style={styles.fieldGroup}>
              <AppText
                variant="caption"
                color="muted"
                style={styles.photoLabel}
              >
                FOTO ANEXADA
              </AppText>
              <Image source={{ uri: images[0] }} style={styles.reviewImage} />
            </View>
          </>
        ) : null}
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
  reviewCard: {
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    borderRadius: layout.radius.panel,
    padding: spacing.md,
  },
  fieldGroup: {
    marginVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  halfField: {
    flex: 1,
  },
  fieldValue: {
    marginTop: spacing.xxs,
  },
  photoLabel: {
    marginBottom: spacing.xs,
  },
  reviewImage: {
    width: 120,
    height: 90,
    borderRadius: layout.radius.button,
  },
});
