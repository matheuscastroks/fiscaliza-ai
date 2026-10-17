import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useProblemsStore } from '@/stores/problemsStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppDivider } from '@/components/ui/AppDivider';
import { getUserContributionSummary } from '@/features/participation/selectors';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { problems, loadProblems } = useProblemsStore();

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  const summary = getUserContributionSummary(user, problems);

  const handleLogout = () => {
    logout();
    router.replace('/LoginScreen');
  };

  return (
    <AppScreen edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Identificação do Usuário */}
        <View style={styles.userHeader}>
          <View style={styles.avatarCircle}>
            <MaterialIcons name="person" size={32} color={colors.ink} />
          </View>
          <View style={styles.userInfo}>
            <AppText variant="caption" color="muted">
              Vila Esperança · cidadão participante
            </AppText>
            <AppText variant="sectionTitle" color="ink" style={styles.userName}>
              {user?.name || 'Pessoa de demonstração'}
            </AppText>
            <AppText variant="body" color="muted">
              {user?.email || 'demo@vilaesperanca.exemplo'}
            </AppText>
          </View>
        </View>

        <AppDivider spacingVertical="lg" />

        {/* Resumo de Contribuições Factual */}
        <View style={styles.section}>
          <AppText variant="sectionTitle" color="ink" style={styles.sectionHeading}>
            Minhas Contribuições
          </AppText>
          <AppText variant="body" color="muted" style={styles.sectionSubheading}>
            Ocorrências registradas e acompanhadas neste dispositivo.
          </AppText>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <AppText variant="screenTitle" color="ink">
                {summary.totalReported}
              </AppText>
              <AppText variant="caption" color="muted">
                Registrados
              </AppText>
            </View>

            <View style={styles.metricCard}>
              <AppText variant="screenTitle" color="attention">
                {summary.inProgressCount}
              </AppText>
              <AppText variant="caption" color="muted">
                Em atendimento
              </AppText>
            </View>

            <View style={styles.metricCard}>
              <AppText variant="screenTitle" color="completed">
                {summary.resolvedCount}
              </AppText>
              <AppText variant="caption" color="muted">
                Concluídos
              </AppText>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/HistoryScreen')}
            accessibilityRole="button"
            accessibilityLabel="Ver histórico completo das minhas ocorrências"
          >
            <View style={styles.actionRowLeft}>
              <MaterialIcons name="history" size={20} color={colors.accent} />
              <AppText variant="label" color="ink" style={styles.actionRowText}>
                Ver histórico detalhado das ocorrências
              </AppText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.subtle} />
          </TouchableOpacity>
        </View>

        <AppDivider spacingVertical="lg" />

        {/* Participação Cívica */}
        <View style={styles.section}>
          <AppText variant="sectionTitle" color="ink" style={styles.sectionHeading}>
            Participação Cívica
          </AppText>

          <View style={styles.pointsCard}>
            <View>
              <AppText variant="caption" color="muted">
                PONTOS CÍVICOS ACUMULADOS
              </AppText>
              <AppText variant="screenTitle" color="accent" style={styles.pointsNumber}>
                {summary.points} pts
              </AppText>
            </View>
            <View style={styles.levelBadge}>
              <AppText variant="caption" color="ink" style={styles.levelBadgeText}>
                {summary.levelInfo.title}
              </AppText>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/PointsGuideScreen')}
            accessibilityRole="button"
          >
            <View style={styles.actionRowLeft}>
              <MaterialIcons name="help-outline" size={20} color={colors.accent} />
              <AppText variant="label" color="ink" style={styles.actionRowText}>
                Critérios de pontuação transparente
              </AppText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.subtle} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/RankingScreen')}
            accessibilityRole="button"
          >
            <View style={styles.actionRowLeft}>
              <MaterialIcons name="format-list-numbered" size={20} color={colors.accent} />
              <AppText variant="label" color="ink" style={styles.actionRowText}>
                Ranking comunitário demonstrativo
              </AppText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.subtle} />
          </TouchableOpacity>
        </View>

        <AppDivider spacingVertical="lg" />

        {/* Configurações e Encerramento de Sessão */}
        <View style={styles.section}>
          <AppText variant="sectionTitle" color="ink" style={styles.sectionHeading}>
            Sistema
          </AppText>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/SettingsScreen')}
            accessibilityRole="button"
          >
            <View style={styles.actionRowLeft}>
              <MaterialIcons name="tune" size={20} color={colors.muted} />
              <AppText variant="label" color="ink" style={styles.actionRowText}>
                Controles do ambiente demonstrativo
              </AppText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.subtle} />
          </TouchableOpacity>

          <AppButton
            title="Sair da demonstração"
            variant="destructive"
            onPress={handleLogout}
            style={styles.logoutButton}
          />
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: layout.radius.pill,
    backgroundColor: colors.surfaceSubdued,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    marginTop: spacing.xxs,
    marginBottom: spacing.xxs,
  },
  section: {
    marginVertical: spacing.xs,
  },
  sectionHeading: {
    marginBottom: spacing.xxs,
  },
  sectionSubheading: {
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    borderRadius: layout.radius.panel,
    padding: spacing.md,
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    borderRadius: layout.radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
    minHeight: layout.touchTarget.minHeight,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionRowText: {
    marginLeft: spacing.sm,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubdued,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    borderRadius: layout.radius.panel,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pointsNumber: {
    marginTop: spacing.xxs,
  },
  levelBadge: {
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: layout.radius.pill,
  },
  levelBadgeText: {
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: spacing.lg,
  },
});