import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Problem } from '@/data/mockData';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppDivider } from '@/components/ui/AppDivider';

export interface ReportSuccessProps {
  problem: Problem;
  onNewReport: () => void;
}

export const ReportSuccess: React.FC<ReportSuccessProps> = ({
  problem,
  onNewReport,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialIcons name="check" size={36} color={colors.completed} />
      </View>

      <AppText variant="screenTitle" color="ink" style={styles.title}>
        Ocorrência registrada
      </AppText>

      <View style={styles.protocolBadge}>
        <AppText variant="caption" color="muted">
          PROTOCOLO LOCAL
        </AppText>
        <AppText variant="protocol" color="ink" style={styles.protocolText}>
          {problem.id}
        </AppText>
      </View>

      <AppText variant="body" color="muted" style={styles.description}>
        O relato foi salvo no repositório demonstrativo de Vila Esperança. A ocorrência já está disponível no mapa e na listagem para acompanhamento de status.
      </AppText>

      <AppDivider spacingVertical="lg" />

      <View style={styles.actions}>
        <AppButton
          title="Ver no mapa territorial"
          variant="primary"
          onPress={() => router.replace('/(tabs)')}
          style={styles.actionButton}
        />

        <AppButton
          title="Acompanhar tramitação"
          variant="secondary"
          onPress={() => router.replace(`/ProblemDetailsScreen?id=${problem.id}`)}
          style={styles.actionButton}
        />

        <AppButton
          title="Registrar outra ocorrência"
          variant="quiet"
          onPress={onNewReport}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.contentPadding,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: layout.radius.pill,
    backgroundColor: colors.completedSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  protocolBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSubdued,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    borderRadius: layout.radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginVertical: spacing.md,
  },
  protocolText: {
    marginTop: spacing.xxs,
    fontWeight: '700',
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: spacing.md,
  },
  actions: {
    width: '100%',
    rowGap: spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
});
