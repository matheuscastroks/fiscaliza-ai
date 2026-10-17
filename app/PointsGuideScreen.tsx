import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppDivider } from '@/components/ui/AppDivider';
import { CIVIC_POINTS } from '@/features/participation/gamification';

export default function PointsGuideScreen() {
  return (
    <AppScreen edges={['top']} style={styles.screen}>
      <AppHeader
        title="Critérios de Pontuação"
        context="Vila Esperança · regras cívicas"
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AppText variant="sectionTitle" color="ink" style={styles.heading}>
          Como a participação é reconhecida
        </AppText>
        <AppText variant="body" color="muted" style={styles.subheading}>
          No protótipo do Fiscaliza-AI, a pontuação cívica reflete o engajamento comunitário na identificação e acompanhamento de melhorias urbanas.
        </AppText>

        {/* Critério 1: Relato */}
        <View style={styles.criterionCard}>
          <View style={styles.criterionHeader}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="add-location-alt" size={20} color={colors.accent} />
            </View>
            <View style={styles.criterionTitleArea}>
              <AppText variant="label" color="ink">
                Registro de Ocorrência
              </AppText>
              <AppText variant="caption" color="muted">
                Relato com endereço e descrição
              </AppText>
            </View>
            <View style={styles.pointsPill}>
              <AppText variant="caption" color="accent" style={styles.pointsText}>
                +{CIVIC_POINTS.REPORT_CREATED} pts
              </AppText>
            </View>
          </View>
          <AppText variant="body" color="muted" style={styles.criterionDesc}>
            Atribuído ao registrar uma nova demanda no município. Ajuda a mapear problemas de pavimentação, iluminação ou descarte irregular.
          </AppText>
        </View>

        {/* Critério 2: Apoio */}
        <View style={styles.criterionCard}>
          <View style={styles.criterionHeader}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="thumb-up" size={20} color={colors.accent} />
            </View>
            <View style={styles.criterionTitleArea}>
              <AppText variant="label" color="ink">
                Apoio Comunitário
              </AppText>
              <AppText variant="caption" color="muted">
                Validação de problemas do bairro
              </AppText>
            </View>
            <View style={styles.pointsPill}>
              <AppText variant="caption" color="accent" style={styles.pointsText}>
                +{CIVIC_POINTS.COMMUNITY_VOTE} pt
              </AppText>
            </View>
          </View>
          <AppText variant="body" color="muted" style={styles.criterionDesc}>
            Atribuído ao apoiar ocorrências abertas por outros moradores, sinalizando aos gestores que mais pessoas são afetadas.
          </AppText>
        </View>

        {/* Critério 3: Comentário */}
        <View style={styles.criterionCard}>
          <View style={styles.criterionHeader}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="comment" size={20} color={colors.accent} />
            </View>
            <View style={styles.criterionTitleArea}>
              <AppText variant="label" color="ink">
                Comentário ou Atualização
              </AppText>
              <AppText variant="caption" color="muted">
                Informações complementares
              </AppText>
            </View>
            <View style={styles.pointsPill}>
              <AppText variant="caption" color="accent" style={styles.pointsText}>
                +{CIVIC_POINTS.COMMENT_ADDED} pts
              </AppText>
            </View>
          </View>
          <AppText variant="body" color="muted" style={styles.criterionDesc}>
            Atribuído ao fornecer dados adicionais ou fotos de acompanhamento na linha do tempo da demanda.
          </AppText>
        </View>

        <AppDivider spacingVertical="lg" />

        {/* Princípios de Transparência */}
        <AppText variant="sectionTitle" color="ink" style={styles.heading}>
          Princípios de Transparência
        </AppText>

        <View style={styles.principleItem}>
          <AppText variant="label" color="ink" style={styles.principleTitle}>
            Sem bônus por autodeclaração de urgência
          </AppText>
          <AppText variant="body" color="muted" style={styles.principleDesc}>
            Marcar uma ocorrência como alta gravidade não gera mais pontos. A avaliação de risco deve ser fidedigna e técnica, evitando distorção dos dados.
          </AppText>
        </View>

        <View style={styles.principleItem}>
          <AppText variant="label" color="ink" style={styles.principleTitle}>
            Sem privilégios no atendimento público
          </AppText>
          <AppText variant="body" color="muted" style={styles.principleDesc}>
            A pontuação tem valor pedagógico e cívico dentro da demonstração. No serviço público real, o atendimento segue critérios de risco coletivo e interesse público.
          </AppText>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    paddingHorizontal: spacing.contentPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heading: {
    marginBottom: spacing.xxs,
  },
  subheading: {
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  criterionCard: {
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    borderRadius: layout.radius.panel,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  criterionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: layout.radius.pill,
    backgroundColor: colors.surfaceSubdued,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  criterionTitleArea: {
    flex: 1,
  },
  pointsPill: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: layout.radius.pill,
  },
  pointsText: {
    fontWeight: '700',
  },
  criterionDesc: {
    lineHeight: 20,
  },
  principleItem: {
    marginBottom: spacing.md,
  },
  principleTitle: {
    marginBottom: spacing.xxs,
  },
  principleDesc: {
    lineHeight: 20,
  },
});